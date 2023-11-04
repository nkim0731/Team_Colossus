package com.example.frontend;

import android.content.Context;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.location.LocationRequest;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class EventDisplayActivity extends AppCompatActivity {
    private final String TAG = "EventDisplayActivity";
    private final String server_url = ServerConfig.SERVER_URL;
    private EventAdapter eventAdapter;
    private List<EventData> dataArrayList = new ArrayList<>(); // list of recieved events

    private RecyclerView rv_eventList;

    private Bundle userData;
    private HttpsRequest httpsRequest = new HttpsRequest();
    private LocationRequest locationRequest;
    private double latitude;
    private double longitude;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_schedule);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

        userData = getIntent().getExtras();
        httpsRequest = new HttpsRequest();

        // start tracking location
        getLocation();

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



    private void getLocation() {
        LocationManager locationManager  = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        android.location.LocationListener locationListener = location -> {
            latitude = location.getLatitude();
            longitude = location.getLongitude();
        };
        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000, 10, locationListener);
        locationListener.onLocationChanged(Objects.requireNonNull(locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)));
    }

}
