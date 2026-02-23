Frontend (React)                         Backend (Node/Express)
---------------                           -------------------
| Axios call  | ---- GET /products ---->    | Middleware sees  |
| accessToken |                             | expired JWT      |
| expired     |                             |                  |
---------------                                    |
                                                   |
                                        <---- 401 Unauthorized -----
                                                   |
Frontend intercepts 401                            |
-----------------                                  |
| Call /refresh | ---- POST /refresh ------>  | Validate refreshToken from cookie
| Server sends  |                             | Issue new accessToken cookie
| new cookie    | <---- Set accessToken ----- |
-----------------
Retry original request automatically
