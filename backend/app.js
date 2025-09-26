const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

const PORT = 3000;


//enable CORS
app.use(cors());
//enable json parser
app.use(express.json());

// add route the customer api
const customerRoutes = require('./routes/customers');
//use the route
app.use('/api/customers', customerRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to Customers API');
})
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
main().catch(err => console.log(error));
async function main(){
    //prepare connection string
    const connectionString = "mongodb+srv://andrew:pwj_evf*cam9vnv*XVW@cluster0.yzomxht.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(connectionString);
    mongoose.set('strictQuery', true);

}