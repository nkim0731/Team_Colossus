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
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
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

    private String server_url;
    final  static String TAG = "GroupChat";
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_group_chat);

        //initialize server url
        server_url = "http://10.0.2.2:3000";

        //set up socket connection to server
//        createSocket();
        String chatName = "1"; // TODO update with intent when opening chatroom
        mSocket = SocketManager.getSocket();
        mSocket.emit("joinChatroom", chatName);

        // listener for new messages from other users
        mSocket.on("message", args -> {
            try {
                JSONObject messageObj = new JSONObject((String) args[0]);
                Message m = new Message(messageObj.getString("message"), messageObj.getString("sender"));
                updateMessages(m);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
        });


        //initialize messages list
//        getChatHistory(8);           currently initialized as empty list , will change it later to fetch from database
        messages = new ArrayList<>();

        //initialize recycler view
        messageRecyclerView = findViewById(R.id.recyclerView);
        messageRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        messageAdapter = new MessageAdapter(messages); // 'messages' is a list of message objects
        messageRecyclerView.setAdapter(messageAdapter);


        //initialize message view
        messageEditText = findViewById(R.id.editTextSend);
        sendButton = findViewById(R.id.buttonSend);


        //send button callback
        sendButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                String messageText = messageEditText.getText().toString();
                // Add the message to the message list or send it to a server
                // Then, update the RecyclerView to display the new message

                String user = "User1"; // dummy user. Will change it later
                Message msg = new Message(messageText, user);

                messages.add(msg);
                messageRecyclerView.scrollToPosition(messages.size() - 1);
                messageAdapter.notifyDataSetChanged();
                messageEditText.setText(""); // Clear the message input field

                //upload to database
                try {
                    postRequest(msg);
                } catch (JSONException e) {
//                    Toast.makeText(GroupChat.this,"Not JSON object", Toast.LENGTH_SHORT).show();
                    throw new RuntimeException(e);
                }
            }
        });

    }

    private void updateMessages(Message m) {
        messages.add(m);
        messageRecyclerView.scrollToPosition(messages.size() - 1);
        messageAdapter.notifyDataSetChanged();
    }

    //create socket and connect it to server
    private void createSocket(){
        try{
            mSocket = IO.socket(server_url);
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }

        onMessage = new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        String newText = args[0].toString();
                        String newSender = args[1].toString();
                        Message msg = new Message(newText,newSender);
                        messages.add(msg);
                        messageRecyclerView.scrollToPosition(messages.size() - 1);
                        messageAdapter.notifyDataSetChanged();
                    }
                });
            }
        };
        mSocket.on("message",onMessage);

    }

    //get previous messages of the room
    private void getChatHistory(int chatID){
        OkHttpClient client = new OkHttpClient();
        String url = String.format("%s/api/message_history/?chatID=%s", server_url, chatID);
//        Log.d(TAG,url);
        Request request = new Request.Builder()
                .url(server_url)
                .get()
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.d(TAG,"request err");
                e.printStackTrace();
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                if(response.isSuccessful()){
                    Log.d("GroupChat","response success");
                    String responseData = response.body().string();
                    try {
                        JSONObject jsonObject = new JSONObject(responseData);
                        JSONArray messageArray = jsonObject.getJSONArray("message");

                        for (int i = 0; i < messageArray.length(); i++){
                            String msg = messageArray.getString(i);
                            //add msg to message list (tbd)
                        }
                    } catch (JSONException e) {
                        throw new RuntimeException(e);
                    }
                    //messages = responseData  set message list
                    Log.d(TAG,responseData);
                }else{
                    Log.d(TAG,"response fail");
                }
            }
        });
    }

    //Send post request to server
    private void postRequest(Message msg) throws JSONException {
        OkHttpClient client = new OkHttpClient();
        MediaType mediaType = MediaType.parse("application/json; charset=utf-8");

        //create JSON data
        JSONObject postData = new JSONObject();
        postData.put("message",msg.getMessageText());
        postData.put("sender",msg.getSender());
        RequestBody body = RequestBody.create(postData.toString(),mediaType);

        //Create request
        Request request = new Request.Builder()
                .url(server_url)
                .post(body)
                .build();

        //Send request
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.d(TAG,"request err");
                e.printStackTrace();
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                if(response.isSuccessful()){
                    Log.d("GroupChat","response success");
                    String responseData = response.body().string();
                    Log.d(TAG,responseData);
                }else{
                    Log.d(TAG,"response fail");
                }
            }
        });

    }

}