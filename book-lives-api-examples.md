# Book Lives API Usage Examples

## Enhanced getAllBookLivesForUserService

### Basic Usage
```http
GET /user/book-lives?page=1&limit=10
Authorization: Bearer <user_token>
```

### With Language Filtering
```http
GET /user/book-lives?page=1&limit=10&language=eng
Authorization: Bearer <user_token>
```

### With Multiple Languages
```http
GET /user/book-lives?page=1&limit=10&language=eng,kaz,rus
Authorization: Bearer <user_token>
```

### With Sorting
```http
GET /user/book-lives?page=1&limit=10&sorting=rating
Authorization: Bearer <user_token>
```

### With Language Filtering and Sorting
```http
GET /user/book-lives?page=1&limit=10&language=eng&sorting=alphabetically
Authorization: Bearer <user_token>
```

### With Specific Category for Blogs
```http
GET /user/book-lives?page=1&limit=10&categoryId=64f8a1b2c3d4e5f6a7b8c9d0&language=eng&sorting=newest
Authorization: Bearer <user_token>
```

### Advanced Filtering
```http
GET /user/book-lives?page=1&limit=20&language=eng,kaz&sorting=rating&name=programming&productsLanguage=eng,kaz,rus
Authorization: Bearer <user_token>
```

## Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `page=1` |
| `limit` | number | Items per page (default: 0 = all) | `limit=10` |
| `language` | string/array | Language filter | `language=eng` or `language=eng,kaz` |
| `sorting` | string | Sort type | `sorting=rating` |
| `productsLanguage` | array | Language priority for sorting | `productsLanguage=eng,kaz,rus` |
| `categoryId` | string | Specific category for blogs | `categoryId=64f8a1b2c3d4e5f6a7b8c9d0` |
| `name` | string | Search by name | `name=programming` |

## Sorting Options

- `rating` - Sort by average rating (highest first)
- `alphabetically` - Sort alphabetically by name
- `newest` - Sort by creation date (newest first)
- `default` - Sort by language priority

## Response Format

```json
{
  "success": true,
  "message": "Book lives and blogs retrieved successfully",
  "page": 1,
  "limit": 10,
  "total": 25,
  "data": {
    "categories": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "Programming",
        "description": "Programming related content",
        "image": "categories/programming.jpg",
        "isActive": true,
        "createdAt": "2023-09-06T10:00:00.000Z"
      }
    ],
    "blogs": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "title": "Introduction to JavaScript",
        "content": "Learn the basics of JavaScript...",
        "categoryId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "isActive": true,
        "createdAt": "2023-09-06T11:00:00.000Z"
      }
    ]
  }
}
```

## Features

✅ **Language Filtering**: Filter book lives and blogs by specific languages
✅ **Advanced Sorting**: Multiple sorting options with language priority
✅ **Flexible Parameters**: Support for both single and multiple language values
✅ **Category-specific Blogs**: Get blogs for a specific category or default to first book live
✅ **Consistent Filtering**: Same filters applied to both categories and blogs
✅ **Backward Compatible**: All existing functionality preserved
