const express = require('express')
const crypto = require('node:crypto')  // para crear UUID 
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')
const cors = require('cors')


// se crea un esquema para validar en archivo aparte con funcion

// se usa zod para validaciones


const app = express()

// para que sea express que le el cuerpo se usa el, midleware que trae
app.use(express.json())
// usamo middleware cors para la CORS 
// este te abre todo OJO , para esto usar las opciones de cors

app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:1234',
      'https://movies.com',
      'https://midu.dev'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
}))


app.disable('x-powered-by')

app.get('/', (req, res) => {
  res.json({message:'Hola Mundo!'})
})


// todos los recursos que sean MOVIES se identifican con /movieszz
// para leer los filtros /movies?genre=blablabla
// solo hay que leerlo de la query nadamas!
app.get('/movies', (req, res) => {
 
  const { genre } = req.query   // le parametro genre
  if (genre){
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g=>g.toLowerCase() === genre.toLowerCase())
      )
      return res.json(filteredMovies)
  }

  res.json(movies)
})
// en express las rutas pueden ser regext ( expresiones regulaes)
// path-to-regexp, esta es una biblioteca que usa expresiones regulares para 
// capturar la url y sus parametros
app.get('/movies/:id', (req, res) => { //  get para movies por id
  const { id } = req.params  // en la variables id esta es parametros
  const movie = movies.find(movie  => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).json({message :"Movie not found "})

})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  console.log(req.body)
  
  if (!result.success) {
    // 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // en base de datos
  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data
  }

  // Esto no sería REST, porque estamos guardando
  // el estado de la aplicación en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

// actualizarcon PATCH

app.patch('/movies/:id', (req, res) => { //  get para movies por id

  // validar los datos
  const result = validatePartialMovie(req.body)
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  // busca por id la pelicula
  const { id } = req.params  // en la variables id esta es parametros
  const movieIndex = movies.findIndex(movie  => movie.id === id)  // buscamos la peli
  if (movieIndex ===-1 ) return   res.status(404).json({message :"Movie not found "})
  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }
  movies[movieIndex] = updateMovie
  return res.json(updateMovie)
})


// eliminar un recurso ojo hay que tener una respuesta a a OPTIONS
app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})





const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})
