package com.example.frontend;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.lang.reflect.Type;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.RequestBody;
import okhttp3.Request;
import okhttp3.Response;

public class GroupChat extends AppCompatActivity {

    private Button sendButton;

    private Socket mSocket;
    private Emitter.Listener onMessage;
    private EditText messageEditText;

    private RecyclerView messageRecyclerView;
    private MessageAdapter messageAdapter;
    private List<Message> messages; //record the messages of chat room
    private Bundle userData;
    private HttpsRequest httpsRequest;
    private String username;

    private final String server_url = "http://10.0.2.2:3000";
    // https://calendo.westus2.cloudapp.azure.com:8081
    final  static String TAG = "GroupChat";
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_group_chat);

        userData = getIntent().getExtras();
        String chatName = userData.getString("chatName");
        username = userData.getString("username");

        httpsRequest = new HttpsRequest();

        //set up socket connection to server
        mSocket = SocketManager.getSocket();
        mSocket.emit("joinChatroom", chatName);

        // listener for new messages from other users
        mSocket.on("message", args -> {
            try {
                JSONObject messageObj = new JSONObject((String) args[0]);
                Message m = new Message(messageObj.getString("message"),
                        messageObj.getString("sender"),
                        messageObj.getString("timestamp"),
                        false);
                updateMessages(m);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
        });


        //initialize messages list
        messages = new ArrayList<>();

        //initialize recycler view
        messageRecyclerView = findViewById(R.id.recyclerView);
        messageRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        messageAdapter = new MessageAdapter(messages); // 'messages' is a list of message objects
        messageRecyclerView.setAdapter(messageAdapter);

        //get previous messages
        getChatHistory(chatName);

        //initialize message view
        messageEditText = findViewById(R.id.editTextSend);
        sendButton = findViewById(R.id.buttonSend);


        //send button callback
        sendButton.setOnClickListener(v -> {

            String messageText = messageEditText.getText().toString();
            // Add the message to the message list or send it to a server
            // Then, update the RecyclerView to display the new message

            Message msg = new Message(messageText, username,true);

            mSocket.emit("sendMessage", messageText, username);

            messages.add(msg);
            messageRecyclerView.scrollToPosition(messages.size() - 1);
            messageAdapter.notifyDataSetChanged();
            messageEditText.setText(""); // Clear the message input field
        });

    }

    private void updateMessages(Message m) {
        messages.add(m);
        messageRecyclerView.scrollToPosition(messages.size() - 1);
        messageAdapter.notifyDataSetChanged();
    }

    //get previous messages of the room
    private void getChatHistory(String chatName){
        String url = String.format("%s/api/message_history/?chatName=%s", server_url, chatName);

        httpsRequest.get(url, new HttpsCallback() {
            @Override
            public void onResponse(String response) {
                try {
                    JSONArray messageArray = new JSONArray(response);
                    for (int i = 0; i < messageArray.length(); i++) {
                        JSONObject msgObj = messageArray.getJSONObject(i);
                        Message m = new Message(msgObj.getString("message"),
                                msgObj.getString("sender"),
                                msgObj.getString("timestamp"),
                                false);
                        if (msgObj.getString("sender").equals(username)) {
                            m.setIsSend(true);
                        }
                        messages.add(m);
                    }
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            // This block of code is executed on the main UI thread
                            messageAdapter.notifyDataSetChanged();
                        }
                    });

                } catch (JSONException e) {
                    Log.e(TAG, "Error");
                }
            }

            @Override
            public void onFailure(String error) {
                Log.d(TAG,error);
            }
        });

    }



}