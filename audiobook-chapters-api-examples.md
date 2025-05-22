# 📋 Audiobook Chapters API Usage Examples

## 🔐 Admin Endpoints

### 1. Create Audiobook with Chapters
**Creates a new audiobook and its chapters in a single transaction**

```http
POST /admin/audiobook-chapters
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "bookDetails": {
    "name": "Complete Guide to Programming",
    "description": "A comprehensive audiobook about programming fundamentals and advanced concepts",
    "authorId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "categoryId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "subCategoryId": "64f8a1b2c3d4e5f6a7b8c9d2",
    "publisherId": "64f8a1b2c3d4e5f6a7b8c9d3",
    "price": 29.99,
    "discountPrice": 24.99,
    "type": "audiobook",
    "language": "eng",
    "tags": ["programming", "technology", "education"],
    "coverImage": "covers/programming-guide.jpg",
    "isActive": true
  },
  "chapters": [
    {
      "name": "Chapter 1: Introduction to Programming",
      "description": "Basic concepts and getting started",
      "srNo": 1,
      "file": "audiobooks/programming-guide/chapter1.mp3",
      "duration": "15:30",
      "isActive": true
    },
    {
      "name": "Chapter 2: Variables and Data Types",
      "description": "Understanding different data types",
      "srNo": 2,
      "file": "audiobooks/programming-guide/chapter2.mp3",
      "duration": "22:45",
      "isActive": true
    },
    {
      "name": "Chapter 3: Control Structures",
      "description": "Loops, conditions, and flow control",
      "srNo": 3,
      "file": "audiobooks/programming-guide/chapter3.mp3",
      "duration": "18:20",
      "isActive": true
    },
    {
      "name": "Chapter 4: Functions and Methods",
      "description": "Creating reusable code blocks",
      "srNo": 4,
      "file": "audiobooks/programming-guide/chapter4.mp3",
      "duration": "25:15",
      "isActive": true
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Audiobook chapters created successfully",
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "Chapter 1: Introduction to Programming",
      "description": "Basic concepts and getting started",
      "productId": "64f8a1b2c3d4e5f6a7b8c9d5",
      "srNo": 1,
      "file": "audiobooks/programming-guide/chapter1.mp3",
      "duration": "15:30",
      "isActive": true,
      "createdAt": "2023-09-06T10:00:00.000Z",
      "updatedAt": "2023-09-06T10:00:00.000Z"
    }
    // ... other chapters
  ]
}
```

### 2. Get All Chapters (Admin)
**Retrieve all audiobook chapters with pagination and filtering**

```http
GET /admin/audiobook-chapters?page=1&limit=10&name=Chapter&sort=srNo
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 0 = all)
- `name` (optional): Filter by chapter name
- `sort` (optional): Sort field (default: srNo)

**Response:**
```json
{
  "success": true,
  "message": "Audiobook chapters retrieved successfully",
  "page": 1,
  "limit": 10,
  "total": 25,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "Chapter 1: Introduction to Programming",
      "description": "Basic concepts and getting started",
      "productId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "name": "Complete Guide to Programming",
        "type": "audiobook"
      },
      "srNo": 1,
      "file": "audiobooks/programming-guide/chapter1.mp3",
      "duration": "15:30",
      "isActive": true,
      "createdAt": "2023-09-06T10:00:00.000Z",
      "updatedAt": "2023-09-06T10:00:00.000Z"
    }
    // ... more chapters
  ]
}
```

### 3. Get Chapter by ID (Admin)
**Retrieve a specific chapter by its ID**

```http
GET /admin/audiobook-chapters/64f8a1b2c3d4e5f6a7b8c9d4
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Audiobook chapter retrieved successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "name": "Chapter 1: Introduction to Programming",
    "description": "Basic concepts and getting started",
    "productId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
      "name": "Complete Guide to Programming",
      "authorId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe"
      }
    },
    "srNo": 1,
    "file": "audiobooks/programming-guide/chapter1.mp3",
    "duration": "15:30",
    "isActive": true,
    "createdAt": "2023-09-06T10:00:00.000Z",
    "updatedAt": "2023-09-06T10:00:00.000Z"
  }
}
```

### 4. Get Chapters by Product ID (Admin)
**Retrieve all chapters for a specific audiobook**

```http
GET /admin/audiobook-chapters/product/64f8a1b2c3d4e5f6a7b8c9d5?page=1&limit=20
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Audiobook chapters retrieved successfully",
  "page": 1,
  "limit": 20,
  "total": 4,
  "data": {
    "productData": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
      "name": "Complete Guide to Programming",
      "description": "A comprehensive audiobook about programming",
      "type": "audiobook"
    },
    "chapters": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "name": "Chapter 1: Introduction to Programming",
        "srNo": 1,
        "duration": "15:30"
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
        "name": "Chapter 2: Variables and Data Types",
        "srNo": 2,
        "duration": "22:45"
      }
      // ... more chapters
    ]
  }
}
```

### 5. Update Chapter (Admin)
**Update an existing audiobook chapter**

```http
PUT /admin/audiobook-chapters/64f8a1b2c3d4e5f6a7b8c9d4
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Chapter 1: Updated Introduction to Programming",
  "description": "Enhanced introduction with new examples",
  "duration": "18:45",
  "file": "audiobooks/programming-guide/chapter1-updated.mp3",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Audiobook chapter updated successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "name": "Chapter 1: Updated Introduction to Programming",
    "description": "Enhanced introduction with new examples",
    "productId": "64f8a1b2c3d4e5f6a7b8c9d5",
    "srNo": 1,
    "file": "audiobooks/programming-guide/chapter1-updated.mp3",
    "duration": "18:45",
    "isActive": true,
    "updatedAt": "2023-09-06T11:30:00.000Z"
  }
}
```

### 6. Delete Single Chapter (Admin)
**Delete a specific audiobook chapter**

```http
DELETE /admin/audiobook-chapters/64f8a1b2c3d4e5f6a7b8c9d4
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Audiobook chapter deleted successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "name": "Chapter 1: Introduction to Programming",
    "productId": "64f8a1b2c3d4e5f6a7b8c9d5"
  }
}
```

### 7. Delete All Chapters for Product (Admin)
**Delete all chapters for a specific audiobook**

```http
DELETE /admin/audiobook-chapters/product/64f8a1b2c3d4e5f6a7b8c9d5
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "All audiobook chapters deleted successfully",
  "data": {
    "deletedCount": 4
  }
}
```

## 👤 User Endpoints

### 1. Get Chapter by ID (User)
**Retrieve a specific chapter for end users**

```http
GET /user/audiobook-chapters/64f8a1b2c3d4e5f6a7b8c9d4
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Audiobook chapter retrieved successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "name": "Chapter 1: Introduction to Programming",
    "description": "Basic concepts and getting started",
    "productId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
      "name": "Complete Guide to Programming",
      "authorId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe"
      },
      "coverImage": "covers/programming-guide.jpg"
    },
    "srNo": 1,
    "file": "audiobooks/programming-guide/chapter1.mp3",
    "duration": "15:30",
    "isActive": true
  }
}
```

### 2. Get Chapters by Product ID (User)
**Retrieve all chapters for a specific audiobook (user view)**

```http
GET /user/audiobook-chapters/product/64f8a1b2c3d4e5f6a7b8c9d5?page=1&limit=50
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Audiobook chapters retrieved successfully",
  "page": 1,
  "limit": 50,
  "total": 4,
  "data": {
    "productData": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
      "name": "Complete Guide to Programming",
      "description": "A comprehensive audiobook about programming",
      "authorId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe"
      },
      "coverImage": "covers/programming-guide.jpg",
      "price": 29.99,
      "discountPrice": 24.99
    },
    "chapters": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "name": "Chapter 1: Introduction to Programming",
        "description": "Basic concepts and getting started",
        "srNo": 1,
        "duration": "15:30",
        "isActive": true
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
        "name": "Chapter 2: Variables and Data Types",
        "description": "Understanding different data types",
        "srNo": 2,
        "duration": "22:45",
        "isActive": true
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d7",
        "name": "Chapter 3: Control Structures",
        "description": "Loops, conditions, and flow control",
        "srNo": 3,
        "duration": "18:20",
        "isActive": true
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d8",
        "name": "Chapter 4: Functions and Methods",
        "description": "Creating reusable code blocks",
        "srNo": 4,
        "duration": "25:15",
        "isActive": true
      }
    ]
  }
}
```

## 📊 Response Formats

### ✅ Success Response (Single Item)
```json
{
  "success": true,
  "message": "Audiobook chapter retrieved successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "name": "Chapter 1: Introduction to Programming",
    "description": "Basic concepts and getting started",
    "productId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
      "name": "Complete Guide to Programming"
    },
    "srNo": 1,
    "file": "audiobooks/programming-guide/chapter1.mp3",
    "duration": "15:30",
    "isActive": true,
    "createdAt": "2023-09-06T10:00:00.000Z",
    "updatedAt": "2023-09-06T10:00:00.000Z"
  }
}
```

### ✅ Success Response (Paginated List)
```json
{
  "success": true,
  "message": "Audiobook chapters retrieved successfully",
  "page": 1,
  "limit": 10,
  "total": 25,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "Chapter 1: Introduction to Programming",
      "productId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "name": "Complete Guide to Programming"
      },
      "srNo": 1,
      "duration": "15:30",
      "isActive": true
    }
    // ... more chapters
  ]
}
```

### ❌ Error Responses

#### Chapter Not Found
```json
{
  "success": false,
  "message": "Audiobook chapter not found"
}
```

#### Validation Error
```json
{
  "success": false,
  "message": "Failed to create audiobook chapters",
  "error": "Book creation failed"
}
```

#### Server Error
```json
{
  "success": false,
  "message": "An error occurred",
  "error": "Internal server error"
}
```

## 🔧 Advanced Usage Examples

### Bulk Chapter Creation with Error Handling
```javascript
// JavaScript/Node.js example
const createAudiobookWithChapters = async () => {
  try {
    const response = await fetch('/admin/audiobook-chapters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + adminToken
      },
      body: JSON.stringify({
        bookDetails: {
          name: "Advanced JavaScript Concepts",
          description: "Deep dive into JavaScript",
          authorId: "64f8a1b2c3d4e5f6a7b8c9d0",
          categoryId: "64f8a1b2c3d4e5f6a7b8c9d1",
          publisherId: "64f8a1b2c3d4e5f6a7b8c9d2",
          price: 39.99,
          type: "audiobook"
        },
        chapters: [
          {
            name: "Chapter 1: Closures and Scope",
            srNo: 1,
            file: "js-advanced/chapter1.mp3",
            duration: "28:15"
          },
          {
            name: "Chapter 2: Async/Await Patterns",
            srNo: 2,
            file: "js-advanced/chapter2.mp3",
            duration: "35:20"
          }
        ]
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Audiobook created with', result.data.length, 'chapters');
    } else {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### Filtering and Pagination
```http
# Get chapters with specific filters
GET /admin/audiobook-chapters?page=2&limit=5&name=Introduction&sort=-createdAt
Authorization: Bearer <admin_token>

# Get all chapters for a product (no pagination)
GET /admin/audiobook-chapters/product/64f8a1b2c3d4e5f6a7b8c9d5?limit=0
Authorization: Bearer <admin_token>
```

## 🚀 Integration Tips

1. **Transaction Safety**: The create endpoint uses MongoDB transactions, ensuring data consistency
2. **File Management**: Deleting chapters automatically removes associated S3 files
3. **Sorting**: Chapters are automatically sorted by `srNo` (serial number)
4. **Population**: Related product data is automatically populated in responses
5. **Pagination**: Use `limit=0` to get all results without pagination
6. **Filtering**: Use query parameters to filter results by chapter name or other fields
