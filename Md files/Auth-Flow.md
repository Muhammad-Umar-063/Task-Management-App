Frontend (React)                             Backend (Node/Express)
-----------------                            --------------------
 | Login Page  |                             | /login route     |
 | User clicks |  ---- POST /login --------> | Validate user    |
 | Login btn   |                             | Hash compare pwd |
-----------------                                     |
                                                      |
                                                    Success?
                                                      |
                                       <---- Set HTTP-only cookies ---->
                                   | accessToken & refreshToken            |
                                   | (browser stores them, JS cannot read) |
                       