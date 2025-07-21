import autocannon from 'autocannon'

function generarVentaAleatoria() {
  const cantidadProductos = Math.floor(Math.random() * 6) + 5 // entre 5 y 10
  const carrito = []

  for (let i = 0; i < cantidadProductos; i++) {
    const cantidad = Math.floor(Math.random() * 3) + 1
    const precio = Math.floor(Math.random() * 50) + 10 // precio entre 10 y 59
    carrito.push({
      producto_id: Math.floor(Math.random() * 10) + 1,
      cantidad,
      precio_unitario: precio,
      total_linea: cantidad * precio
    })
  }

  const subtotal = carrito.reduce((sum, item) => sum + item.total_linea, 0)

  return JSON.stringify({
    carrito,
    subtotal,
    descuento: 0,
    iva: 0,
    total: subtotal,
    cliente_nombre: 'Cliente Benchmark',
    observacion: 'Venta aleatoria de stress test'
  })
}

// Mostrar memoria antes
console.log('🧠 Memoria antes:', (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2), 'MB')

const instance = autocannon({
  url: 'http://localhost:3000/api/ventas',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tYnJlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGNhLmNvbSIsInJvbCI6ImFkbWluIiwiaWF0IjoxNzUzMDQwNDczLCJleHAiOjE3NTMwODM2NzN9.yfKTZRMRp59xBJ2RklwUOj2mnjKzlVTvJYs8I4aodGc'
  },
  connections: 5,
  duration: 15, // 🔥 Stress prolongado: 30 segundos
  setupClient: (client) => {
    client.setBody(generarVentaAleatoria())
  }
})

instance.on('tick', () => process.stdout.write('.'))

instance.on('done', (results) => {
  console.log('\n\n✅ Benchmark terminado')
  console.log(`📦 Total Requests: ${results.requests.total}`)
  console.log(`⚡ Promedio req/sec: ${results.requests.mean.toFixed(2)}`)
  console.log(`⏱️ Latencia promedio: ${results.latency.average.toFixed(2)} ms`)
  console.log(`📶 Throughput promedio: ${(results.throughput.mean / 1024).toFixed(2)} KB/s`)
  console.log('🧠 Memoria después:', (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2), 'MB')
})
