import { IProductRepository } from "@/core/domain/repositories/IProductRepository";
import { ICategoryRepository } from "@/core/domain/repositories/ICategoryRepository";
import { MenuCategoryVM } from "@/core/application/dtos/menu-view-model";
import { Category } from "@/core/domain/entities/types";

export class GetMenuUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly categoryRepo: ICategoryRepository
  ) {}

  async execute(empresaId: string): Promise<MenuCategoryVM[]> {
    // 1. Ejecutar consultas en paralelo para eficiencia
    const [products, categories] = await Promise.all([
      this.productRepo.findAllByTenant(empresaId),
      this.categoryRepo.findAllByTenant(empresaId),
    ]);

    // 2. Filtrar categorías que no son complemento (excluir categoria_complemento_de)
    const mainCategories = categories.filter((cat) => !cat.categoriaComplementoDe);

    // 3. Obtener categorías de complementos y crear mapa
    const complementCategories = categories.filter((cat) => cat.categoriaComplementoDe);
    const complementsByCategoryId = new Map<string, typeof products>();
    for (const compCat of complementCategories) {
      const parentId = compCat.categoriaComplementoDe!;
      // Products now use categoria_id (snake_case)
      const compProducts = products.filter((p) => p.categoriaId === compCat.id && p.activo);
      if (!complementsByCategoryId.has(parentId)) {
        complementsByCategoryId.set(parentId, []);
      }
      complementsByCategoryId.get(parentId)!.push(...compProducts);
    }

    // 4. Obtener map de complemento_obligatorio por categoría padre
    const complementoObligatorioMap = new Map<string, boolean>();
    for (const compCat of complementCategories) {
      if (compCat.categoriaComplementoDe) {
        complementoObligatorioMap.set(compCat.categoriaComplementoDe, compCat.complementoObligatorio);
      }
    }

    // 5. Separar categorías principales de subcategorías (por categoria_padre_id)
    const parentCategories = mainCategories.filter((cat) => !cat.categoriaPadreId);
    const subCategories = mainCategories.filter((cat) => cat.categoriaPadreId);

    // 5.1 Ordenar categorías principales y subcategorías por campo 'orden'
    parentCategories.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    subCategories.sort((a, b) => (a.orden || 0) - (b.orden || 0));

    // 6. Crear mapa de subcategorías por su categoría padre (ya ordenadas)
    const subcategoriesByParent = new Map<string, Category[]>();
    for (const subCat of subCategories) {
      const parentId = subCat.categoriaPadreId!;
      if (!subcategoriesByParent.has(parentId)) {
        subcategoriesByParent.set(parentId, []);
      }
      subcategoriesByParent.get(parentId)!.push(subCat);
    }

    // 7. Crear mapa de TODAS las categorías por ID para búsqueda rápida
    const categoriesById = new Map<string, Category>();
    for (const cat of categories) {
      categoriesById.set(cat.id, cat);
    }

    // 8. Mapear y agrupar - solo categorías principales (padres)
    const menu: MenuCategoryVM[] = parentCategories.map((parentCat) => {
      // Obtener subcategorías de esta categoría padre
      const childSubcategories = subcategoriesByParent.get(parentCat.id) || [];

      // Productos de la categoría padre (si los hay, aunque normalmente estarán en subcategorías)
      // Products now use categoria_id (snake_case)
      const parentProducts = products.filter((p) => p.categoriaId === parentCat.id && p.activo);

      // Productos de las subcategorías
      const subcategoryProducts = childSubcategories.flatMap((subCat) =>
        // Products now use categoria_id (snake_case)
        products.filter((p) => p.categoriaId === subCat.id && p.activo)
      );

      // Combinar todos los productos
      const allProducts = [...parentProducts, ...subcategoryProducts];

      // Obtener complementos para esta categoría
      const categoryComplements = complementsByCategoryId.get(parentCat.id) || [];
      const requiresComplement = complementoObligatorioMap.get(parentCat.id) || false;

      return {
        id: `category-${parentCat.id}`,
        label: parentCat.nombre ?? 'Unnamed Category',
        descripcion: parentCat.descripcion || undefined,
        translations: {
          en: parentCat.translations?.en ? { name: parentCat.translations.en, description: parentCat.descripcionTranslations?.en || undefined } : undefined,
          fr: parentCat.translations?.fr ? { name: parentCat.translations.fr, description: parentCat.descripcionTranslations?.fr || undefined } : undefined,
          it: parentCat.translations?.it ? { name: parentCat.translations.it, description: parentCat.descripcionTranslations?.it || undefined } : undefined,
          de: parentCat.translations?.de ? { name: parentCat.translations.de, description: parentCat.descripcionTranslations?.de || undefined } : undefined,
        },
        descripcionTranslations: {
          en: parentCat.descripcionTranslations?.en || undefined,
          fr: parentCat.descripcionTranslations?.fr || undefined,
          it: parentCat.descripcionTranslations?.it || undefined,
          de: parentCat.descripcionTranslations?.de || undefined,
        },
        subcategories: childSubcategories.length > 0 ? childSubcategories.map((subCat) => ({
          id: subCat.id,
          nombre: subCat.nombre,
          descripcion: subCat.descripcion || undefined,
          translations: {
            en: subCat.translations?.en ? { name: subCat.translations.en, description: subCat.descripcionTranslations?.en || undefined } : undefined,
            fr: subCat.translations?.fr ? { name: subCat.translations.fr, description: subCat.descripcionTranslations?.fr || undefined } : undefined,
            it: subCat.translations?.it ? { name: subCat.translations.it, description: subCat.descripcionTranslations?.it || undefined } : undefined,
            de: subCat.translations?.de ? { name: subCat.translations.de, description: subCat.descripcionTranslations?.de || undefined } : undefined,
          },
          descripcionTranslations: {
            en: subCat.descripcionTranslations?.en || undefined,
            fr: subCat.descripcionTranslations?.fr || undefined,
            it: subCat.descripcionTranslations?.it || undefined,
            de: subCat.descripcionTranslations?.de || undefined,
          },
          products: products.filter((p) => p.categoriaId === subCat.id && p.activo).map((p) => ({
            id: p.id,
            name: p.titulo_es,
            description: p.descripcion_es || undefined,
            price: p.precio,
            category: (subCat.nombre || 'uncategorized').toLowerCase().replaceAll(" ", "-"),
            image: p.fotoUrl || undefined,
            highlight: p.esEspecial,
            translations: {
              en: p.titulo_en ? { name: p.titulo_en, description: p.descripcion_en || undefined } : undefined,
              fr: p.titulo_fr ? { name: p.titulo_fr, description: p.descripcion_fr || undefined } : undefined,
              it: p.titulo_it ? { name: p.titulo_it, description: p.descripcion_it || undefined } : undefined,
              de: p.titulo_de ? { name: p.titulo_de, description: p.descripcion_de || undefined } : undefined,
            },
          })),
        })) : undefined,
        items: allProducts.map((p) => {
          // Obtener la categoría correcta para este producto
          const productCategory = p.categoriaId ? categoriesById.get(p.categoriaId) : undefined;
          const categoryName: string = (productCategory?.nombre ?? parentCat?.nombre ?? 'uncategorized');
          
          return {
            id: p.id,
            name: p.titulo_es,
            description: p.descripcion_es || undefined,
            price: p.precio,
            category: (categoryName ?? 'uncategorized').toLowerCase().replaceAll(" ", "-"),
            image: p.fotoUrl || undefined,
            highlight: p.esEspecial,
            translations: {
              en: p.titulo_en ? { name: p.titulo_en, description: p.descripcion_en || undefined } : undefined,
              fr: p.titulo_fr ? { name: p.titulo_fr, description: p.descripcion_fr || undefined } : undefined,
              it: p.titulo_it ? { name: p.titulo_it, description: p.descripcion_it || undefined } : undefined,
              de: p.titulo_de ? { name: p.titulo_de, description: p.descripcion_de || undefined } : undefined,
            },
            complements: categoryComplements.length > 0 ? categoryComplements.map((c) => ({
              id: c.id,
              name: c.titulo_es,
              price: c.precio,
              description: c.descripcion_es || undefined,
            })) : undefined,
            requiresComplement: requiresComplement || undefined,
          };
        }),
      };
    });

    // 8. Filtrar categorías vacías
    return menu.filter((cat) => cat.items.length > 0);
  }
}
