const express = require('express')
const exphbs = require('express-handlebars')

const PORT = 3000
const app = express()

app.engine('hbs', exphbs({ dafaultLayout: 'main', extname: '.hbs' }))
app.set('view engine', 'hbs')


app.get('/', (req, res) => {
  res.render('index')
})


app.listen(PORT, (req, res) => {
  console.log(`App is listening on http://localhost:${PORT}`)
})