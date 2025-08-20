import Usuario from './Usuario.js'
import Rol from './Rol.js'
import Categoria from './Categoria.js'
import Producto from './Producto.js'
import Caja from './caja.js'
import Venta from './Venta.js'
import DetalleVenta from './DetalleVenta.js'
import Ticket from './Ticket.js'
import Egreso from './Egreso.js'
import InventarioLote from './InventarioLote.js'
import MovimientoCaja from './MovimientoCaja.js'
import DetalleVentaLote from './DetalleVentaLote.js'
import HistorialProducto from './HistorialProductoPrecio.js'
import Permiso from './Permiso.js'
import ClaveCancelacion from './ClaveCancelacion.js'
import  Ingreso from './Ingreso.js'
import  StockMovimiento from './StockMovimiento.js'


 

// Relaciones
Rol.hasMany(Usuario, { foreignKey: 'role_id' });
Usuario.belongsTo(Rol, { foreignKey: 'role_id' });

Rol.belongsToMany(Permiso, { through: 'rol_permisos', foreignKey: 'rol_id' })
Permiso.belongsToMany(Rol, { through: 'rol_permisos', foreignKey: 'permiso_id' })

Categoria.hasMany(Producto, { foreignKey: 'categoria_id' })
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id' })

Usuario.hasMany(Caja, { foreignKey: 'usuario_id' })
Caja.belongsTo(Usuario, { foreignKey: 'usuario_id' })

Caja.hasMany(Venta, { foreignKey: 'caja_id' })
Venta.belongsTo(Caja, { foreignKey: 'caja_id' })
Usuario.hasMany(Venta, { foreignKey: 'usuario_id' })
Venta.belongsTo(Usuario, { foreignKey: 'usuario_id' })

Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id' })
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id' })
Producto.hasMany(DetalleVenta, { foreignKey: 'producto_id' })
DetalleVenta.belongsTo(Producto, { foreignKey: 'producto_id' })
Venta.hasOne(Ticket, { foreignKey: 'venta_id' });
Ticket.belongsTo(Venta, { foreignKey: 'venta_id' });


Usuario.hasMany(Ticket, { foreignKey: 'usuario_id' })
Ticket.belongsTo(Usuario, { foreignKey: 'usuario_id' })
 
Caja.hasMany(Egreso, { foreignKey: 'caja_id' })
Egreso.belongsTo(Caja, { foreignKey: 'caja_id' })

Usuario.hasMany(Egreso, { foreignKey: 'usuario_id' })
Egreso.belongsTo(Usuario, { foreignKey: 'usuario_id' })


Producto.hasMany(InventarioLote, { foreignKey: 'producto_id' })
InventarioLote.belongsTo(Producto, { foreignKey: 'producto_id' })
Egreso.hasMany(InventarioLote, { foreignKey: 'egreso_id' });
InventarioLote.belongsTo(Egreso, { foreignKey: 'egreso_id' });

 


 
DetalleVenta.hasMany(DetalleVentaLote, { foreignKey: 'detalle_venta_id' });
DetalleVentaLote.belongsTo(DetalleVenta, { foreignKey: 'detalle_venta_id' });

 
InventarioLote.hasMany(DetalleVentaLote, { foreignKey: 'inventario_lote_id' });
DetalleVentaLote.belongsTo(InventarioLote, { foreignKey: 'inventario_lote_id' });

Producto.hasMany(HistorialProducto, { foreignKey: 'producto_id' });
HistorialProducto.belongsTo(Producto, { foreignKey: 'producto_id' });

// Relaciones
Caja.hasMany(Ingreso, { foreignKey: 'caja_id' });
Ingreso.belongsTo(Caja, { foreignKey: 'caja_id' });

Usuario.hasMany(Ingreso, { foreignKey: 'usuario_id' });
Ingreso.belongsTo(Usuario, { foreignKey: 'usuario_id' });

//

// Relaciones
Producto.hasMany(StockMovimiento, { foreignKey: 'producto_id' });
StockMovimiento.belongsTo(Producto, { foreignKey: 'producto_id' });

Usuario.hasMany(StockMovimiento, { foreignKey: 'usuario_id' });
StockMovimiento.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Egreso.hasMany(StockMovimiento, { foreignKey: 'referencia_id', constraints: false, scope: { referencia_tipo: 'egreso' } });
StockMovimiento.belongsTo(Egreso, { foreignKey: 'referencia_id', constraints: false });

Venta.hasMany(StockMovimiento, { foreignKey: 'referencia_id', constraints: false, scope: { referencia_tipo: 'venta' } });
StockMovimiento.belongsTo(Venta, { foreignKey: 'referencia_id', constraints: false });

export {
  Usuario, Rol, Categoria, Producto, Caja,
  Venta, DetalleVenta, Ticket, Egreso, InventarioLote,
  MovimientoCaja, DetalleVentaLote, HistorialProducto,
  Permiso, ClaveCancelacion, Ingreso,StockMovimiento
}
