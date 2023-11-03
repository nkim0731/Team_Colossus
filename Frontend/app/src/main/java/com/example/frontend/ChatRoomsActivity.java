package com.example.frontend;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.MenuItem;

import java.util.ArrayList;
import java.util.List;

public class ChatRoomsActivity extends AppCompatActivity {

    private Bundle userData;
    private List<ChatRoom> chatRooms;
    private RecyclerView chatRoomRecyclerView;
    private ChatRoomAdapter chatRoomAdapter;
    private HttpsRequest httpsRequest;
    private String url;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat_rooms);

        //Set action bar
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.setDisplayHomeAsUpEnabled(true);
        }



        // chatrooms data get from userData.getStringArrayList("chatrooms")

        //initialize https request
        httpsRequest = new HttpsRequest();

        //get value from previous intent
        userData = getIntent().getExtras();

        //initialize the list of chat rooms
        chatRooms = new ArrayList<>();

        //initialize recyclerView
        chatRoomRecyclerView = findViewById(R.id.chatRoomRecyclerView);
        chatRoomRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        chatRoomAdapter = new ChatRoomAdapter(chatRooms,this);
        chatRoomRecyclerView.setAdapter(chatRoomAdapter);

        if(userData.getString("userEmail") != null){
            Log.d("ChatRoom",userData.getString("userEmail"));
        }else {
            Log.d("ChatRoom","pass user email is null");
        }


        // list of all chat rooms from get request
        findViewById(R.id.chatRoom1).setOnClickListener(view -> {


            int size = chatRooms.size();
            ChatRoom newRoom = new ChatRoom("room " + size);
            chatRooms.add(newRoom);
            chatRoomRecyclerView.scrollToPosition(chatRooms.size()-1);
            chatRoomAdapter.notifyDataSetChanged();

        });
    }


    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        int id = item.getItemId();

        if (id == android.R.id.home) {
            // respond to back arrow
            onBackPressed();
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    private void getChatRooms(){

        url = String.format("http://10.0.2.2:3000//api/chatrooms?user=%s",userData.getString("userEmail"));
    }
}