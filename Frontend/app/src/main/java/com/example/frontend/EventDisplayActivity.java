package com.example.frontend;

import android.location.Location;
import android.location.LocationListener;
import android.os.Bundle;
import android.util.Log;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class EventDisplayActivity extends AppCompatActivity implements LocationListener {
    private final String TAG = "EventDisplayActivity";
    EventAdapter eventAdapter;
    List<EventData> dataArrayList = new ArrayList<>(); // replace to list of received events

    private RecyclerView rv_eventList;

    Bundle userData;
    String latLong;
    private HttpsRequest httpsRequest = new HttpsRequest();


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_schedule);

        userData = getIntent().getExtras();
        String userEmail = userData.getString("userEmail", "default User Email");
        userData.putString("location", latLong);
//        String latLong = userData.getString("", "default Latitude and Longitude");


        rv_eventList = findViewById(R.id.rv_eventList);
        rv_eventList.setLayoutManager(new LinearLayoutManager(this));
        eventAdapter = new EventAdapter(dataArrayList,this);
        rv_eventList.setAdapter(eventAdapter);

        // HTTP
        // POST : {user email, location, preference}
        // GET : dataArrayList = events[];

        // replace dataArrayList from received schedule event list from server.
        EventData newEvent1 = new EventData("startTime", "eventName", "duration");
        EventData newEvent2 = new EventData("3:30pm", "CPEN321", "1.5 hour");
        dataArrayList.add(newEvent1);
        dataArrayList.add(newEvent2);


    }

    @Override
    public void onLocationChanged(Location location) {
        double currentLatitude = location.getLatitude();
        double currentLongitude = location.getLongitude();
        latLong = "" + currentLatitude + ", " + currentLongitude;


        Log.d(TAG, "Lat and Long: "+ latLong);
    }
}
