import { IProductRepository } from "@/core/domain/repositories/IProductRepository";
import { ICategoryRepository } from "@/core/domain/repositories/ICategoryRepository";
import { MenuCategoryVM } from "@/core/application/dtos/menu-view-model";

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
    const mainCategories = categories.filter((cat) => !cat.categoria_complemento_de);

    // 3. Obtener categorías de complementos y crear mapa
    const complementCategories = categories.filter((cat) => cat.categoria_complemento_de);
    const complementsByCategoryId = new Map<string, typeof products>();
    for (const compCat of complementCategories) {
      const parentId = compCat.categoria_complemento_de!;
      // Products now use categoria_id (snake_case)
      const compProducts = products.filter((p) => p.categoria_id === compCat.id && p.activo);
      if (!complementsByCategoryId.has(parentId)) {
        complementsByCategoryId.set(parentId, []);
      }
      complementsByCategoryId.get(parentId)!.push(...compProducts);
    }

    // 4. Obtener map de complemento_obligatorio por categoría padre
    const complementoObligatorioMap = new Map<string, boolean>();
    for (const compCat of complementCategories) {
      if (compCat.categoria_complemento_de) {
        complementoObligatorioMap.set(compCat.categoria_complemento_de, compCat.complemento_obligatorio);
      }
    }

    // 5. Separar categorías principales de subcategorías (por categoria_padre_id)
    const parentCategories = mainCategories.filter((cat) => !cat.categoria_padre_id);
    const subCategories = mainCategories.filter((cat) => cat.categoria_padre_id);

    // 6. Crear mapa de subcategorías por su categoría padre
    const subcategoriesByParent = new Map<string, typeof subCategories>();
    for (const subCat of subCategories) {
      const parentId = subCat.categoria_padre_id!;
      if (!subcategoriesByParent.has(parentId)) {
        subcategoriesByParent.set(parentId, []);
      }
      subcategoriesByParent.get(parentId)!.push(subCat);
    }

    // 7. Crear mapa de TODAS las categorías por ID para búsqueda rápida
    const categoriesById = new Map<string, typeof categories>();
    for (const cat of categories) {
      categoriesById.set(cat.id, cat);
    }

    // 8. Mapear y agrupar - solo categorías principales (padres)
    const menu: MenuCategoryVM[] = parentCategories.map((parentCat) => {
      // Obtener subcategorías de esta categoría padre
      const childSubcategories = subcategoriesByParent.get(parentCat.id) || [];

      // Productos de la categoría padre (si los hay, aunque normalmente estarán en subcategorías)
      // Products now use categoria_id (snake_case)
      const parentProducts = products.filter((p) => p.categoria_id === parentCat.id && p.activo);

      // Productos de las subcategorías
      const subcategoryProducts = childSubcategories.flatMap((subCat) =>
        // Products now use categoria_id (snake_case)
        products.filter((p) => p.categoria_id === subCat.id && p.activo)
      );

      // Combinar todos los productos
      const allProducts = [...parentProducts, ...subcategoryProducts];

      // Obtener complementos para esta categoría
      const categoryComplements = complementsByCategoryId.get(parentCat.id) || [];
      const requiresComplement = complementoObligatorioMap.get(parentCat.id) || false;

      return {
        id: `category-${parentCat.id}`,
        label: parentCat.nombre_es,
        descripcion: parentCat.descripcion_es || undefined,
        translations: {
          en: parentCat.nombre_en ? { name: parentCat.nombre_en, description: parentCat.descripcion_en || undefined } : undefined,
          fr: parentCat.nombre_fr ? { name: parentCat.nombre_fr, description: parentCat.descripcion_fr || undefined } : undefined,
          it: parentCat.nombre_it ? { name: parentCat.nombre_it, description: parentCat.descripcion_it || undefined } : undefined,
          de: parentCat.nombre_de ? { name: parentCat.nombre_de, description: parentCat.descripcion_de || undefined } : undefined,
        },
        descripcionTranslations: {
          en: parentCat.descripcion_en || undefined,
          fr: parentCat.descripcion_fr || undefined,
          it: parentCat.descripcion_it || undefined,
          de: parentCat.descripcion_de || undefined,
        },
        subcategories: childSubcategories.length > 0 ? childSubcategories.map((subCat) => ({
          id: subCat.id,
          nombre: subCat.nombre_es,
          descripcion: subCat.descripcion_es || undefined,
          translations: {
            en: subCat.nombre_en ? { name: subCat.nombre_en, description: subCat.descripcion_en || undefined } : undefined,
            fr: subCat.nombre_fr ? { name: subCat.nombre_fr, description: subCat.descripcion_fr || undefined } : undefined,
            it: subCat.nombre_it ? { name: subCat.nombre_it, description: subCat.descripcion_it || undefined } : undefined,
            de: subCat.nombre_de ? { name: subCat.nombre_de, description: subCat.descripcion_de || undefined } : undefined,
          },
          descripcionTranslations: {
            en: subCat.descripcion_en || undefined,
            fr: subCat.descripcion_fr || undefined,
            it: subCat.descripcion_it || undefined,
            de: subCat.descripcion_de || undefined,
          },
          products: products.filter((p) => p.categoria_id === subCat.id && p.activo).map((p) => ({
            id: p.id,
            name: p.titulo_es,
            description: p.descripcion_es || undefined,
            price: p.precio,
            category: (subCat.nombre_es || 'uncategorized').toLowerCase().replaceAll(" ", "-"),
            image: p.foto_url || undefined,
            highlight: p.es_especial,
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
          const productCategory = categoriesById.get(p.categoria_id);
          const categoryName = productCategory?.nombre_es || parentCat?.nombre_es || 'uncategorized';
          
          return {
            id: p.id,
            name: p.titulo_es,
            description: p.descripcion_es || undefined,
            price: p.precio,
            category: (categoryName || 'uncategorized').toLowerCase().replaceAll(" ", "-"),
            image: p.foto_url || undefined,
            highlight: p.es_especial,
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
