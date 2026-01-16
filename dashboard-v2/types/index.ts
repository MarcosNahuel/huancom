export interface Producto {
  id: string
  sku: string
  nombre: string
  descripcion_corta: string | null
  precio_venta: number | null
  precio_normal: number | null
  stock: number
  valor_inventario: number | null
  categorias: string[] | null
  link_huangcom: string | null
  link_meli: string | null
  imagenes: string[] | null
  created_at: string
  updated_at: string
}

export interface Pedido {
  id: string
  order_id: string
  origen: 'MELI' | 'WOO'
  sku: string | null
  fecha_venta: string | null
  unidades: number
  precio_unitario: number | null
  total: number | null
  estado: string | null
  comprador_nombre: string | null
  provincia: string | null
  ciudad: string | null
  forma_entrega: string | null
  tracking_number: string | null
  titulo_publicacion: string | null
  created_at: string
}

export interface Pregunta {
  id: string
  id_pregunta: string | null
  fecha_pregunta: string | null
  estado: string | null
  pregunta: string | null
  respuesta: string | null
  fuente_consultada: string | null
  sku: string | null
  id_usuario: string | null
  efectuo_compra: boolean
  origen: string | null
  created_at: string
}

export interface Asiento {
  id: string
  fecha_compra: string | null
  importe_total: number | null
  tipo_comprobante: string | null
  numero_factura: string | null
  proveedor: string | null
  total_factura: number | null
  iva: number | null
  medio_pago: string | null
  tipo_gasto: string | null
  centro_costo: string | null
  tipo_movimiento: 'EGRESO' | 'INGRESO'
  anio_mes: string | null
  created_at: string
}

export interface ResultadoMensual {
  anio_mes: string
  centro_costo: string | null
  ingresos: number
  egresos: number
  resultado: number
}

export interface VentasPorProducto {
  sku: string
  nombre: string
  stock: number
  precio_venta: number | null
  valor_inventario: number | null
  total_pedidos: number
  unidades_vendidas: number
  ingresos_totales: number
  ticket_promedio: number
}

export interface ConversionPreguntas {
  mes: string
  total_preguntas: number
  compraron: number
  tasa_conversion: number
  tiempo_respuesta_promedio: number | null
}

export interface CostoFijo {
  id: string
  estado: string | null
  centro_costo: string | null
  tipo: string | null
  descripcion: string | null
  medio_pago: string | null
  costo_mensual_ars: number | null
  observaciones: string | null
}

export interface DateRange {
  from: Date
  to: Date
}
