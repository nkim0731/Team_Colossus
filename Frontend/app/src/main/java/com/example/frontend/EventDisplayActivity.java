package com.example.frontend;

import android.os.Bundle;
import android.view.WindowManager;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class EventDisplayActivity extends AppCompatActivity {
    private final String TAG = "EventDisplayActivity";
    private final String server_url = ServerConfig.SERVER_URL;
    private EventAdapter eventAdapter;
    private List<EventData> dataArrayList = new ArrayList<>(); // list of received events

    private RecyclerView rv_eventList;

    private Bundle userData;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_schedule);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

        userData = getIntent().getExtras();
        if (userData.getString("scheduleJSON") == null) {
            Toast.makeText(getApplicationContext(), "No schedule was generated, Please go and generate", Toast.LENGTH_LONG).show();
        }

        // initialize recyclerView
        rv_eventList = findViewById(R.id.rv_eventList);
        rv_eventList.setLayoutManager(new LinearLayoutManager(this));
        eventAdapter = new EventAdapter(dataArrayList,this);
        rv_eventList.setAdapter(eventAdapter);

        // temporary samples
        EventData newEvent1 = new EventData("startTime", "eventName", "duration");
        EventData newEvent2 = new EventData("3:30pm", "CPEN321", "1.5 hour");
        dataArrayList.add(newEvent1);
        dataArrayList.add(newEvent2);


    }
}
