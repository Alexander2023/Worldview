
# Worldview - 3D Metaverse

Worldview is a browser-based platform for the creation and use of 3D virtual rooms designed for real-time, 
multi-party collaboration. It aims to make video conferencing
more personal and natural by supporting embedded media and by simplifying
the process of leaving and joining groups through user-controlled movement.
## Run Locally

Clone the project

```bash
  git clone https://github.com/Alexander2023/Worldview.git
```

Ensure target host meets all requirements of mediasoup using the following link: https://mediasoup.org/documentation/v3/mediasoup/installation/

Set up the server

```bash
  cd server
  npm install
  npm run dev
```

Set up the client

```bash
  cd client
  npm install
  npm run start
```

Join an instance of the room by opening up a browser tab(s) and entering the following url: http://localhost:3000


## Future Improvements

- Add auto-redirection to active speaker
- Add screen sharing capability
- Add CRUD functionality to embedded screens
- Make room state persistent

## Tech Stack

**Client:** React, Three.js

**Server:** Node, Socket.io, Mediasoup

