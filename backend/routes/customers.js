const express = require('express');

const router = express.Router();

const Customer = require('../models/Customer');

//Get: list
router.get('/', async(req, res) =>{
    try{
        const customers = await Customer.find();
        res.status(200).json(customers);
    }
    catch(error){
        res.status(500).json({message: "An error occurred", error: error});
    }

});

//Get: get by id
router.get('/:id', async(req, res) =>{
    try{
        const id = req.params.id
        const customers = await Customer.findOne({_id: id});
        res.status(200).json(customers);
    }
    catch(error){
        res.status(500).json({message: "An error occurred", error: error});
    }

});

//POST: create
router.post('/', async(req, res) =>{
    try{
        const customer = new Customer(req.body);
        const savedCustomer= customer.save();
        res.status(200).json(savedCustomer);
    }
    catch(error){
        res.status(500).json({message: "An error occurred", error: error});
    }

});

//PUT: update 
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updatedCustomer = await Customer.findOneAndUpdate(
            { _id: id },         // filtro
            { $set: req.body },  // lo que vas a actualizar
            { new: true }        // devuelve el documento actualizado
        );

        if (!updatedCustomer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.status(200).json(updatedCustomer);
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error: error });
    }
});

//DELETE: delete by id
router.delete('/:id', async(req, res) =>{
    try{
        const id = req.params.id
        let deletedCustomer= await Customer.deleteOne({_id: id})

        res.status(200).json(updatedCustomer);
    }
    catch(error){
        res.status(500).json({message: "An error occurred", error: error});
    }

});

module.exports = router;