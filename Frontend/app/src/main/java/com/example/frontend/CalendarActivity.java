package com.example.frontend;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.icu.util.Calendar;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.CalendarView;
import android.widget.TextView;
import android.widget.Toast;

import java.text.SimpleDateFormat;
import java.util.Locale;

import io.socket.client.Socket;

public class CalendarActivity extends AppCompatActivity {
    private final String TAG = "CalendarActivity";
    CalendarView calendarView;
    Calendar calendar;
    TextView tv_schedule;
    Button chatButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_calendar);

        // initialize socket connection
        Socket socket = SocketManager.getSocket();
        socket.connect();
        chatButton = findViewById(R.id.button_chat);
        chatButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent chatIntent = new Intent(CalendarActivity.this,GroupChat.class);
                startActivity(chatIntent);
            }
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
        // connect chat page.

    }
}