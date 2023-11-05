package com.example.frontend;

import android.content.Context;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.location.LocationRequest;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class EventDisplayActivity extends AppCompatActivity {
    private final String TAG = "EventDisplayActivity";
    private final String server_url = "http://10.0.2.2:3000";
    private EventAdapter eventAdapter;
    private List<EventData> dataArrayList = new ArrayList<>(); // list of recieved events

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
