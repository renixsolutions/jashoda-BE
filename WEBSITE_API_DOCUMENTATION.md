# Website API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

---

## Product APIs

### 1. Get Product List
**GET** `/products`

Get paginated list of products with filtering options.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `category` (optional) - Filter by category name or ID
- `subcategory` (optional) - Filter by subcategory name or ID
- `categoryId` (optional) - Filter by category ID
- `subcategoryId` (optional) - Filter by subcategory ID
- `search` (optional) - Search in name, description, SKU, short description
- `sortBy` (optional, default: 'created_at') - Sort field (created_at, price, name)
- `sortOrder` (optional, default: 'desc') - Sort order (asc, desc)
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter
- `metalType` (optional) - Filter by metal type (Gold, Silver, Platinum)
- `stoneType` (optional) - Filter by stone type (Diamond, Zircon, etc.)
- `inStock` (optional, true/false) - Filter by stock availability

**Example Request:**
```
GET /api/v1/products?page=1&limit=20&category=Rings&minPrice=1000&maxPrice=50000&inStock=true
```

**Response:**
```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Gold Ring",
      "slug": "gold-ring",
      "sku": "JSL-RING-001",
      "category": "Rings",
      "subcategory": "Engagement Ring",
      "price": "25000.00",
      "discount_price": "22500.00",
      "description": "Beautiful gold ring",
      "short_description": "Premium gold ring",
      "metal_type": "Gold",
      "purity": "22K",
      "metal_weight": 5.5,
      "stone_type": "Diamond",
      "stone_weight": 0.5,
      "images": [
        {
          "id": 1,
          "url": "/uploads/products/image1.jpg",
          "is_primary": true,
          "sort_order": 0
        }
      ],
      "stock_quantity": 10,
      "stock_status": "in_stock",
      "status": "active",
      "created_at": "2026-02-18T00:00:00.000Z",
      "updated_at": "2026-02-18T00:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

### 2. Get Product by ID or Slug
**GET** `/products/:id`

Get detailed product information by ID or slug.

**Parameters:**
- `id` - Product ID (number) or slug (string)

**Example Requests:**
```
GET /api/v1/products/1
GET /api/v1/products/gold-ring
```

**Response:**
```json
{
  "success": true,
  "message": "Product fetched successfully",
  "data": {
    "id": 1,
    "name": "Gold Ring",
    "slug": "gold-ring",
    "sku": "JSL-RING-001",
    "category": "Rings",
    "subcategory": "Engagement Ring",
    "brand": "Jashoda Collection",
    "price": "25000.00",
    "discount_price": "22500.00",
    "making_charges": "2000.00",
    "gst_percentage": 18,
    "description": "Full description...",
    "short_description": "Short description",
    "metal_type": "Gold",
    "purity": "22K",
    "metal_weight": 5.5,
    "stone_type": "Diamond",
    "stone_weight": 0.5,
    "stone_count": 1,
    "certification": "IGI",
    "length": 20.5,
    "width": 15.2,
    "ring_size": "7",
    "stock_quantity": 10,
    "stock_status": "in_stock",
    "weight": 5.5,
    "returnable": true,
    "warranty": "1 Year",
    "images": [
      {
        "id": 1,
        "url": "/uploads/products/image1.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": 2,
        "url": "/uploads/products/image2.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "status": "active",
    "created_at": "2026-02-18T00:00:00.000Z",
    "updated_at": "2026-02-18T00:00:00.000Z"
  }
}
```

---

## Category APIs

### 3. Get All Categories
**GET** `/categories`

Get paginated list of all categories (both parent and subcategories).

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50)
- `status` (optional, default: 'active') - Filter by status
- `search` (optional) - Search in name or slug
- `sortBy` (optional, default: 'created_at')
- `sortOrder` (optional, default: 'asc')

**Example Request:**
```
GET /api/v1/categories?page=1&limit=50&status=active
```

**Response:**
```json
{
  "success": true,
  "message": "Categories fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Rings",
      "slug": "rings",
      "description": "Beautiful rings collection",
      "image_url": "/uploads/categories/rings.jpg",
      "parent_id": null,
      "status": "active",
      "created_at": "2026-02-18T00:00:00.000Z",
      "updated_at": "2026-02-18T00:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

---

### 4. Get Parent Categories Only
**GET** `/categories/parents`

Get all parent categories (categories without a parent).

**Example Request:**
```
GET /api/v1/categories/parents
```

**Response:**
```json
{
  "success": true,
  "message": "Parent categories fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Rings",
      "slug": "rings",
      "description": "Rings collection",
      "image_url": "/uploads/categories/rings.jpg",
      "parent_id": null,
      "status": "active"
    },
    {
      "id": 2,
      "name": "Necklaces",
      "slug": "necklaces",
      "description": "Necklaces collection",
      "image_url": "/uploads/categories/necklaces.jpg",
      "parent_id": null,
      "status": "active"
    }
  ]
}
```

---

### 5. Get Subcategories by Parent ID
**GET** `/categories/parents/:parentId/subcategories`

Get all subcategories for a specific parent category.

**Parameters:**
- `parentId` - Parent category ID

**Example Request:**
```
GET /api/v1/categories/parents/1/subcategories
```

**Response:**
```json
{
  "success": true,
  "message": "Subcategories fetched successfully",
  "data": [
    {
      "id": 3,
      "name": "Engagement Rings",
      "slug": "engagement-rings",
      "description": "Engagement rings",
      "image_url": "/uploads/categories/engagement-rings.jpg",
      "parent_id": 1,
      "status": "active"
    },
    {
      "id": 4,
      "name": "Wedding Rings",
      "slug": "wedding-rings",
      "description": "Wedding rings",
      "image_url": "/uploads/categories/wedding-rings.jpg",
      "parent_id": 1,
      "status": "active"
    }
  ]
}
```

---

### 6. Get Category by ID or Slug with Products
**GET** `/categories/:id`

Get category details along with products in that category.

**Parameters:**
- `id` - Category ID (number) or slug (string)

**Query Parameters:**
- `page` (optional, default: 1) - Page number for products
- `limit` (optional, default: 20) - Products per page

**Example Requests:**
```
GET /api/v1/categories/1?page=1&limit=20
GET /api/v1/categories/rings?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "message": "Category with products fetched successfully",
  "data": {
    "category": {
      "id": 1,
      "name": "Rings",
      "slug": "rings",
      "description": "Beautiful rings collection",
      "image_url": "/uploads/categories/rings.jpg",
      "parent_id": null,
      "status": "active"
    },
    "products": [
      {
        "id": 1,
        "name": "Gold Ring",
        "slug": "gold-ring",
        "price": "25000.00",
        "images": [...],
        "stock_status": "in_stock"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

---

## Error Responses

All APIs return errors in the following format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": null
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

1. All product APIs only return products with `status = 'active'`
2. All category APIs only return categories with `status = 'active'` by default
3. Product images are always included in the response
4. All prices are returned as strings in decimal format
5. Pagination metadata is included in the `meta.pagination` object
6. Products can be filtered by category name or ID
7. Subcategories can be filtered separately from parent categories

