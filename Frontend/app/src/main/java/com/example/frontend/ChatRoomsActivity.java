package com.example.frontend;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;

public class ChatRoomsActivity extends AppCompatActivity {

    private Bundle userData;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat_rooms);

        userData = getIntent().getExtras();

        // list of all chatrooms from get request
        findViewById(R.id.chatRoom1).setOnClickListener(view -> {
            String chatName = (String) view.getTag();
            userData.putString("chatName", chatName);

            Intent groupChatIntent = new Intent(ChatRoomsActivity.this, GroupChat.class);
            groupChatIntent.putExtras(userData);
            startActivity(groupChatIntent);
        });
    }
}