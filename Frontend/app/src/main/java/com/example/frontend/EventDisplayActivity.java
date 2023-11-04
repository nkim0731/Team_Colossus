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

                // TODO https connection : send the info to create a new event


                Intent eventIntent = new Intent(EventDisplayActivity.this, CalendarActivity.class);
                startActivity(eventIntent);
            }


        });
    }
}
