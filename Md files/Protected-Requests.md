Frontend (React)                             Backend (Node/Express)
----------------                              -------------------
| Products.js  |                             | /products route  |
| useEffect()  | ---- GET /products ------>  | Middleware reads |
| fetchProducts|                             | accessToken from |
| API call     |                             | cookie           |
----------------                             |                  |
                                                  Verify JWT
                                                      |
                                                     OK?
                                                      |
                                       <---- Response: product list ---->
   