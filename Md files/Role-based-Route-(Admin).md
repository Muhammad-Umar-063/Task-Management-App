Frontend (React)                            Backend (Node/Express)
---------------                              -------------------
| Admin.js    |                             | /admin route     |
| useEffect() | ---- GET /admin --------->  | Middleware checks|
| API call    |                             | accessToken JWT  |
---------------                             | Role = admin?    |
                                                    |
                                            Yes -> return "Welcome Admin"
                                            No  -> 403 Access Denied
