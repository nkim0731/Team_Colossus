package com.example.frontend;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import java.util.ArrayList;
import java.util.List;

public class GroupChat extends AppCompatActivity {

    private Button sendButton;
    private EditText messageEditText;

    private RecyclerView messageRecyclerView;

    private List<Message> messages;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_group_chat);

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
        sendButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String messageText = messageEditText.getText().toString();
                // Add the message to the message list or send it to a server
                // Then, update the RecyclerView to display the new message
                messages.add(new Message(messageText, "User1"));
                messageRecyclerView.scrollToPosition(messages.size() - 1);
                messageAdapter.notifyDataSetChanged();
                messageEditText.setText(""); // Clear the message input field
            }
        });

    }
}