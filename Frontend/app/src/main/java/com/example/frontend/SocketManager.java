package com.example.frontend;

import java.net.URISyntaxException;

import io.socket.client.IO;
import io.socket.client.Socket;

// Creates socket instance in main activity, can then emit events elsewhere
public class SocketManager {
    private static Socket socket;

    public static synchronized Socket getSocket() {
        if (socket == null) {
            try {
                socket = IO.socket("http://10.0.2.2:3000/"); // TODO replace with vm uri
            } catch (URISyntaxException e) {
                e.printStackTrace();
            }
        }
        return socket;
    }
}
