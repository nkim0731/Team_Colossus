package com.example.frontend;

import static com.google.android.gms.common.internal.safeparcel.SafeParcelable.NULL;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.location.LocationRequest;
import android.os.Build;
import android.os.Bundle;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.LocationSettingsStatusCodes;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;


import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import kotlin.jvm.internal.TypeReference;

public class EventDisplayActivity extends AppCompatActivity {
    private final String TAG = "EventDisplayActivity";
    private final String server_url = "http://10.0.2.2:3000"; // TODO update with actual url
    EventAdapter eventAdapter;
    List<EventData> dataArrayList = new ArrayList<>(); // list of recieved events

    private RecyclerView rv_eventList;

    Bundle userData;
    String latLong;

    Button submit;
    EditText eventName;
    EditText location;
    EditText startTime;
    EditText endTime;
    String sEventName;
    String sLocation;
    String sStartTime;
    String sEndTime;
    private HttpsRequest httpsRequest = new HttpsRequest();

    private LocationRequest locationRequest;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // button to take user inputs to create an event
        setContentView(R.layout.test_create_event);
        eventName = findViewById(R.id.et_eName);
        location = findViewById(R.id.et_location);
        startTime = findViewById(R.id.et_sTime);
        endTime = findViewById(R.id.et_eTime);



        submit = findViewById(R.id.button_submit);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // can use these strings
                sEventName = eventName.getText().toString();
                sLocation = location.getText().toString();
                sStartTime = startTime.getText().toString();
                sEndTime = endTime.getText().toString();

                // all the original codes should be inside here.
                setContentView(R.layout.activity_schedule);
                getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);


                userData = getIntent().getExtras();
                String userEmail = userData.getString("userEmail", "default User Email");
                userData.putString("location", latLong);
//        String latLong = userData.getString("", "default Latitude and Longitude");

                Log.d(TAG, "Lat and Long: "+ latLong);


                //initialize recyclerView
                rv_eventList = findViewById(R.id.rv_eventList);
                rv_eventList.setLayoutManager(new LinearLayoutManager(this));
                eventAdapter = new EventAdapter(dataArrayList,this);
                rv_eventList.setAdapter(eventAdapter);

                // don't need upper part. just receive an array of events from server.
                // POST : {user email, location, preference}
                // GET : dataArrayList = response(events[]);
                // send necessary data to backend for database
                if(latLong == NULL){
                    Log.d(TAG, "Latitude and Longitude value is null.");
                } else{
                    JSONObject postData = new JSONObject();
                    try {
                        postData.put("username", userEmail);
                        postData.put("access_token", latLong);
                    } catch (JSONException e){
                        Log.e(TAG, "unexpected JSON exception", e);
                    }

                    httpsRequest.post(server_url + "/api/calendar/day_schedule", postData, new HttpsCallback() {
                        @Override
                        public void onResponse(String response) {
                            try{
                                JSONObject responseObj = new JSONObject(response);
                                ObjectMapper mapper = new ObjectMapper();
                                dataArrayList = responseObj.mapper(response, new TypeReference<List<EventData>>(){});

                            }catch (JSONException e){}
                        }

                        @Override
                        public void onFailure(String error) {

                        }
                    });

//        EventData newEvent1 = new EventData("startTime", "eventName", "duration");
//        EventData newEvent2 = new EventData("3:30pm", "CPEN321", "1.5 hour");
//        dataArrayList.add(newEvent1);
//        dataArrayList.add(newEvent2);
                }


            }


        });
    }
}
