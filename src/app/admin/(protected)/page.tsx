import { cookies } from 'next/headers';
import { authAdminUseCase } from '@/core/infrastructure/database';
import { getMenuUseCase } from '@/lib/server-services';
import type { MenuCategoryVM } from '@/core/application/dtos/menu-view-model';

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    return <div>No autorizado</div>;
  }

  const admin = await authAdminUseCase.verifyToken(token);

  if (!admin) {
    return <div>No autorizado</div>;
  }

  const menuResult = await getMenuUseCase.execute(admin.empresaId);
  
  // Handle error case
  if (menuResult.error || !menuResult.data) {
    return (
      <div className="pt-20 lg:pt-0 px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground mb-6">
          Gestionando: <strong>{admin.empresa.nombre}</strong>
        </p>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">Error al cargar el menú: {menuResult.error}</p>
        </div>
      </div>
    );
  }

  const menu: MenuCategoryVM[] = menuResult.data;
  const totalProductos = menu.reduce((sum, cat) => sum + cat.items.length, 0);
  const totalCategorias = menu.length;
  const productosEspeciales = menu.reduce(
    (sum, cat) => sum + cat.items.filter((item) => item.highlight).length,
    0
  );

  return (
    <div className="pt-20 lg:pt-0 px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Dashboard
      </h1>
      <p className="text-muted-foreground mb-6">
        Gestionando: <strong>{admin.empresa.nombre}</strong>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-card p-4 lg:p-6 rounded-lg shadow-sm border border-border">
          <p className="text-sm text-muted-foreground">Categorías</p>
          <p className="text-2xl lg:text-3xl font-bold text-primary">{totalCategorias}</p>
        </div>
        <div className="bg-card p-4 lg:p-6 rounded-lg shadow-sm border border-border">
          <p className="text-sm text-muted-foreground">Productos</p>
          <p className="text-2xl lg:text-3xl font-bold text-primary">{totalProductos}</p>
        </div>
        <div className="bg-card p-4 lg:p-6 rounded-lg shadow-sm border border-border">
          <p className="text-sm text-muted-foreground">Productos Especiales</p>
          <p className="text-2xl lg:text-3xl font-bold text-foreground">{productosEspeciales}</p>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border p-4 lg:p-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Vista Previa del Menú</h2>
        <div className="space-y-4">
          {menu.map((categoria) => (
            <div key={categoria.id} className="border-b border-border pb-4 last:border-0">
              <h3 className="font-semibold text-foreground">{categoria.label}</h3>
              <p className="text-sm text-muted-foreground">{categoria.items.length} productos</p>
            </div>
          ))}
          {menu.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No hay categorías configuradas
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
