package com.example.frontend;

import android.Manifest;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;

import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;


/*
 * Number of methods: 2
 * */
public class AfterSuccessLoginActivity extends AppCompatActivity  {
    private final String TAG = "MainMenuActivity";
//    private Button calendarButton;
//    private Button settingButton;
    private Bundle userData;
    private HttpsRequest httpsRequest;

    private final String server_url = ServerConfig.SERVER_URL;


    /*
     * ChatGPT usage: Partial
     * */
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_after_successful_login);

        // get userdata from login
        userData = getIntent().getExtras();
        httpsRequest = new HttpsRequest();



        // This asks for scopes to get refresh_token for user calendar access
        // this does not have the necessary permissions to run
//        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
//                .requestProfile()
//                .requestEmail()
//                .requestIdToken(getString(R.string.server_client_id))
//                .requestServerAuthCode(getString(R.string.server_client_id))
//                .requestScopes(
//                        new Scope("https://www.googleapis.com/auth/calendar.readonly"),
//                        new Scope("https://www.googleapis.com/auth/userinfo.email"),
//                        new Scope("https://www.googleapis.com/auth/userinfo.profile")
//                )
//                .build();
//
//        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);
//        performSilentSignIn();


        // calendar
        Button calendarButton = findViewById(R.id.button_calendar);
        calendarButton.setOnClickListener(view -> {
//            checkPermission();
            Intent calendarIntent = new Intent(AfterSuccessLoginActivity.this, CalendarActivity.class);
            calendarIntent.putExtras(userData);
            startActivity(calendarIntent);
        });

        // settings == preference setting
        Button settingButton = findViewById(R.id.button_setting);
        settingButton.setOnClickListener(view -> {
            // move to setting page, set preference
            Intent settingIntent = new Intent(AfterSuccessLoginActivity.this, PreferenceActivity.class);
            // get users set preferences first
            httpsRequest.get(server_url + "/api/preferences?user=" + userData.getString("userEmail"), null, new HttpsCallback() {

                @Override
                public void onResponse(String response) {
                    Log.d(TAG, response);
                    userData.putString("preferences", response); // put json string into data bundle
                    settingIntent.putExtras(userData);
                    startActivity(settingIntent);
                }
                @Override
                public void onFailure(String error) {
                    Log.e(TAG, "Server error: " + error);
                }
            });
        });

    }

    /*
     * ChatGPT usage: Partial
     * */

//    private void checkPermission(){
//        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED) {
//
//            Intent serviceIntent = new Intent(this, ActivityRecognitionService.class);
//            ContextCompat.startForegroundService(this, serviceIntent);
//            Log.d("Alarm", "permission allowed");
//        }else{
//            Log.d("Alarm", "no permission");
//            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACTIVITY_RECOGNITION}, 1);
//
//        }
//    }

}

