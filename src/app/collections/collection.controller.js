const CollectionModel = require('./collection.model');

class CollectionController {
  static async list(req, res) {
    try {
      const collections = await CollectionModel.findAll(req.query);
      res.json({
        success: true,
        data: collections
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching collections',
        error: error.message
      });
    }
  }

  static async getById(req, res) {
    try {
      const collection = await CollectionModel.findById(req.params.id);
      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Collection not found'
        });
      }
      res.json({
        success: true,
        data: collection
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching collection',
        error: error.message
      });
    }
  }

  static async create(req, res) {
    try {
      const collection = await CollectionModel.create(req.body);
      res.status(201).json({
        success: true,
        data: collection
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating collection',
        error: error.message
      });
    }
  }

  static async update(req, res) {
    try {
      const collection = await CollectionModel.update(req.params.id, req.body);
      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Collection not found'
        });
      }
      res.json({
        success: true,
        data: collection
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating collection',
        error: error.message
      });
    }
  }

  static async remove(req, res) {
    try {
      await CollectionModel.delete(req.params.id);
      res.json({
        success: true,
        message: 'Collection deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting collection',
        error: error.message
      });
    }
  }

  static async getProducts(req, res) {
    try {
      const { id } = req.params;
      let collectionId = id;

      // If ID is not a number, assume it's a slug and find the ID
      if (!/^\d+$/.test(id)) {
        const collection = await CollectionModel.findBySlug(id);
        if (!collection) {
          // Return empty data instead of 404 to avoid frontend crash if collection is missing
          return res.json({
            success: true,
            data: [],
            message: 'Collection not found'
          });
        }
        collectionId = collection.id;
      }

      const products = await CollectionModel.getProducts(collectionId, req.query);
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching products for collection',
        error: error.message
      });
    }
  }
}

module.exports = CollectionController;
