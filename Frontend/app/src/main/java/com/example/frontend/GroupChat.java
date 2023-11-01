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

    private final String server_url = "http://10.0.2.2:3000";
    // https://calendo.westus2.cloudapp.azure.com:8081
    final  static String TAG = "GroupChat";
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_group_chat);

        userData = getIntent().getExtras();
        String chatName = userData.getString("chatName");
        httpsRequest = new HttpsRequest();

        //set up socket connection to server
        mSocket = SocketManager.getSocket();
        mSocket.emit("joinChatroom", chatName);

        // listener for new messages from other users
        mSocket.on("message", args -> {
            try {
                JSONObject messageObj = new JSONObject((String) args[0]);
                Message m = new Message(messageObj.getString("message"), messageObj.getString("sender"), messageObj.getString("timestamp"),false);
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
//        int chatID = 8;
//        getChatHistory(chatID);
        httpsRequest.get(server_url + "/api/message_history?chatName=" + chatName, new HttpsCallback() {
            @Override
            public void onResponse(String response) {
                // array
                Type listType = new TypeToken<List<Message>>(){}.getType();
                List<Message> msg = new Gson().fromJson(response, listType);
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        // This block of code is executed on the main UI thread
                        messages.addAll(msg);
                        messageAdapter.notifyDataSetChanged();
                    }
                });
            }
            @Override
            public void onFailure(String error) {
                Log.e(TAG, error);
            }
        });

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

                String user = "User1"; // dummy user. TODO get it from Intent
                Message msg = new Message(messageText, user,true);

                messages.add(msg);
                messageRecyclerView.scrollToPosition(messages.size() - 1);
                messageAdapter.notifyDataSetChanged();
                messageEditText.setText(""); // Clear the message input field


                //create post request
                HttpsRequest postClient = new HttpsRequest();
                //create JSON data
                MediaType mediaType = MediaType.parse("application/json; charset=utf-8");
                JSONObject postData = new JSONObject();
                try {
                    postData.put("message",msg.getMessageText());
                    postData.put("sender",msg.getSender());
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }


                //upload message to database
                postClient.post(server_url, postData, new HttpsCallback() {
                    @Override
                    public void onResponse(String response) {
                        Log.d(TAG,response);
                    }

                    @Override
                    public void onFailure(String error) {
                        Log.d(TAG,"fail");
                    }
                });


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
                        Message msg = new Message(newText,newSender,false);
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
        HttpsRequest getRequest = new HttpsRequest();
        String url = String.format("%s/api/message_history/?chatID=%s", server_url, chatID);

        getRequest.get("http://10.0.2.2:3000/message", new HttpsCallback() { //test locally right now
            @Override
            public void onResponse(String response) {
//                JSONObject jsonObject = new JSONObject(response);
//                JSONArray messageArray = jsonObject.getJSONArray("message");

                Type listType = new TypeToken<List<Message>>(){}.getType();
                List<Message>  msg= new Gson().fromJson(response, listType);
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        // This block of code is executed on the main UI thread
                        messages.addAll(msg);
                        messageAdapter.notifyDataSetChanged();
                    }
                });

//                Log.d(TAG,messages.get(0).getTimestamp());
            }

            @Override
            public void onFailure(String error) {
                Log.d(TAG,error);
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