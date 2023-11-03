package com.example.frontend;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.icu.util.Calendar;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.CalendarView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import io.socket.client.Socket;

public class CalendarActivity extends AppCompatActivity {
    private final String TAG = "CalendarActivity";
    private CalendarView calendarView;
    private Calendar calendar;
    private TextView tv_schedule;
    private Button chatButton;

    private Bundle userData;
    private HttpsRequest httpsRequest;
    private final String url = "http://10.0.2.2:3000"; // TODO update with actual url

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
            httpsRequest.get(url + "/api/chatrooms?user=" + userData.getString("userEmail"), null, new HttpsCallback() {
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

            // only go to activity once backend responds with user chatrooms
//            chatRoomsIntent.putExtras(userData);
//            startActivity(chatRoomsIntent);
        });

        calendarView = findViewById(R.id.calendarView);
        calendar = Calendar.getInstance();

        getDate();
        calendarView.setOnDateChangeListener(new CalendarView.OnDateChangeListener() {
            @Override
            public void onSelectedDayChange(@NonNull CalendarView calendarView, int year, int month, int day) {
                int nMonth = month+1;
                Toast.makeText(CalendarActivity.this, day + "/" + nMonth + "/" + year, Toast.LENGTH_SHORT).show();
            }

        });
    }

    public void getDate(){
        long date = calendarView.getDate();
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("dd/MM/yy", Locale.getDefault());
        calendar.setTimeInMillis(date);
        String selected_date = simpleDateFormat.format(calendar.getTime());
        Toast.makeText(getApplicationContext(), selected_date, Toast.LENGTH_SHORT).show();

        // selected_data load its events and show them under the calendar.
        // GET
        tv_schedule = findViewById(R.id.textView_schedule);
    }
}