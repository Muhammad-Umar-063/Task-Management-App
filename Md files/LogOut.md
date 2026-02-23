Frontend (React)                                     Backend (Node/Express)
----------------                                      -------------------
| Logout btn   | ---- POST /logout ---->     | Remove refreshToken from server memory
|              |                             | Clear accessToken & refreshToken cookies
----------------                                         |
                                           <---- Response: Logged out ---->
            