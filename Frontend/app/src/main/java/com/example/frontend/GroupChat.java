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

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.RequestBody;
import okhttp3.Request;
import okhttp3.Response;

public class GroupChat extends AppCompatActivity {

    private Button sendButton;
    private EditText messageEditText;

    private RecyclerView messageRecyclerView;

    private List<Message> messages;

    private String server_url;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_group_chat);

        //initialize server url
        server_url = "http://10.0.2.2:3000";
        //initialize messages list
        messages = new ArrayList<>();
        //initialize recycler view
        messageRecyclerView = findViewById(R.id.recyclerView);
        messageRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        MessageAdapter messageAdapter = new MessageAdapter(messages); // 'messages' is a list of message objects
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
                try {
                    postRequest(msg);
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
                messages.add(msg);
                messageRecyclerView.scrollToPosition(messages.size() - 1);
                messageAdapter.notifyDataSetChanged();
                messageEditText.setText(""); // Clear the message input field
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
                Log.d("GroupChat","request err");
                e.printStackTrace();
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                if(response.isSuccessful()){
                    Log.d("GroupChat","response success");
                    String responseData = response.body().string();
                    Log.d("GroupChat",responseData);
                }else{
                    Log.d("GroupChat","response fail");
                }
            }
        });

    }

}