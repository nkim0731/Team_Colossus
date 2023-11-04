package com.example.frontend;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.icu.util.Calendar;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.CalendarView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Locale;

import io.socket.client.Socket;

public class CalendarActivity extends AppCompatActivity {
    private final String TAG = "CalendarActivity";
    private CalendarView calendarView;
    private Calendar calendar;
    private TextView tv_schedule;
    private Button chatButton;

    private Bundle userData;
    private Button eventDisplay;
    private HttpsRequest httpsRequest;
    private String selectedDate;
    private final String server_url = ServerConfig.SERVER_URL;
    private TextView scheduleDisplay;

    Button createEvent;
    Button btn;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_calendar);

        userData = getIntent().getExtras();
        httpsRequest = new HttpsRequest();

        // initialize socket connection
        Socket socket = SocketManager.getSocket();
        socket.connect();

        chatButton = findViewById(R.id.button_chat);
        chatButton.setOnClickListener(view -> {
            Intent chatRoomsIntent = new Intent(CalendarActivity.this, ChatRoomsActivity.class);

            // get list of chatrooms associated with the user
            httpsRequest.get(server_url + "/api/chatrooms?user=" + userData.getString("userEmail"), null, new HttpsCallback() {
                @Override
                public void onResponse(String response) {
                    try {
                        JSONArray chatRoomsJson = new JSONArray(response);
                        ArrayList<String> chatRooms = new ArrayList<>();

                        for (int i = 0; i < chatRoomsJson.length(); i++) {
                            JSONObject chatRoom = (JSONObject) chatRoomsJson.get(i);
                            chatRooms.add(chatRoom.getString("chatName"));
                        }
                        userData.putStringArrayList("chatrooms", chatRooms);

                        // add chatrooms to intent and navigate to chatrooms
                        chatRoomsIntent.putExtras(userData);
                        startActivity(chatRoomsIntent);
                    } catch (JSONException e) {
                        Log.e(TAG, "Error on response: JSON error");
                    }
                }
                @Override
                public void onFailure(String error) {
                    Log.e(TAG, "Network error: Server probably closed");
                }
            });
        });
        calendarView = findViewById(R.id.calendarView);
        calendar = Calendar.getInstance();

        getDate();
        calendarView.setOnDateChangeListener(new CalendarView.OnDateChangeListener() {
            @Override
            public void onSelectedDayChange(@NonNull CalendarView calendarView, int year, int month, int day) {
                int nMonth = month+1;
                Toast.makeText(CalendarActivity.this, day + "/" + nMonth + "/" + year, Toast.LENGTH_SHORT).show();
                selectedDate = String.format("%04d-%02d-%02d", year, month + 1, day);
            }
        });

        // go to create schedule event
        eventDisplay = findViewById(R.id.button_eventDisplay);
        eventDisplay.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent eventIntent = new Intent(CalendarActivity.this, EventDisplayActivity.class);
//                userData.putString("selectedDate", selectedDate);
                eventIntent.putExtras(userData);
                // check if location permissions have been granted before
                int fineLocationPermission = ActivityCompat.checkSelfPermission(CalendarActivity.this, android.Manifest.permission.ACCESS_FINE_LOCATION);
                int coarseLocationPermission = ActivityCompat.checkSelfPermission(CalendarActivity.this, android.Manifest.permission.ACCESS_COARSE_LOCATION);

                if (fineLocationPermission == PackageManager.PERMISSION_GRANTED && coarseLocationPermission == PackageManager.PERMISSION_GRANTED) {
                    startActivity(eventIntent);
                } else {
                    Log.w(TAG, "No location permissions");
                    Toast.makeText(CalendarActivity.this, "Need location permissions to create schedule", Toast.LENGTH_LONG).show();
                }
            }
        });

        scheduleDisplay = findViewById(R.id.tv_scheduleDisplay);
        // TODO https
        String received_from_backend = "";
        scheduleDisplay.setText(received_from_backend);

        // move to CreateNewEvent.java to create new event
        createEvent = findViewById(R.id.button_createEvent);
        createEvent.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                //
                Intent createEventIntent = new Intent(CalendarActivity.this, CreateNewEvent.class);
                startActivity(createEventIntent);
            }
        });

        btn = findViewById(R.id.button_simple);
        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // Todo
            }
        });

    }

    public void getDate(){
        long date = calendarView.getDate();
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        SimpleDateFormat displayDateFormat = new SimpleDateFormat("dd/MM/yy", Locale.getDefault());
        calendar.setTimeInMillis(date);
        selectedDate = simpleDateFormat.format(calendar.getTime());
        Toast.makeText(getApplicationContext(), displayDateFormat.format(calendar.getTime()), Toast.LENGTH_SHORT).show();
    }

}
