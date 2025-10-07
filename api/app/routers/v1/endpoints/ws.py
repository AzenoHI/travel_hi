from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.ws_manager import manager

router = APIRouter()


@router.websocket("")
async def websocket_endpoint(ws: WebSocket):
    """
    ### 🔌 WebSocket: Real-time traffic events channel

    Establishes a **bidirectional WebSocket connection** between the client and the backend.
    This connection is used to deliver **live traffic updates**, new incident notifications,
    and other real-time messages.

    **Workflow:**
    1. Client connects to `/ws` endpoint.
    2. The server accepts and adds the socket to the connection manager.
    3. Server sends a `welcome` JSON message confirming the connection.
    4. Client can send messages — all incoming messages are broadcast back to all connected clients
       (echo / global notification simulation).
    5. When client disconnects, connection is removed gracefully.

    **Example connection (JavaScript):**
    ```js
    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = (event) => console.log("Message:", event.data);
    ws.onopen = () => ws.send("Hello from client!");
    ```

    **Example server message:**
    ```json
    {
      "type": "welcome",
      "message": "connected"
    }
    ```

    **Broadcast example:**
    ```json
    {
      "type": "echo",
      "message": "Hello from client!"
    }
    ```

    **Disconnects:**
    - If a user disconnects intentionally or due to network issues, the connection
      is removed from the manager without error.
    - Any other unhandled exception is logged on the server.

    ---
    **Usage Tip:**
    This endpoint is the foundation for real-time incident updates —
    when new reports are created via `/incidents`, they are broadcast here.
    """
    await manager.connect(ws)
    await ws.send_json({"type": "welcome", "message": "connected"})

    try:
        while True:
            msg = await ws.receive_text()
            await manager.broadcast({"type": "echo", "message": msg})

    except WebSocketDisconnect:
        await manager.disconnect(ws)
    except Exception as e:
        print("WS error:", e)
        await manager.disconnect(ws)
