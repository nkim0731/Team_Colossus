package com.example.frontend;



import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import android.view.View;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;


import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;


/*
 * Number of methods: 2
 * */
public class AfterSuccessLoginActivity extends AppCompatActivity  {
    private final String TAG = "AfterSuccessLoginActivity";
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

            // Import calendar in the database
            initiateCalendarImport();

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

        // handle sign out
        Button signOutButton = findViewById(R.id.button_signOut);
        signOutButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent mainIntent = new Intent(AfterSuccessLoginActivity.this, MainActivity.class);
                mainIntent.putExtra("signout", true);
                startActivity(mainIntent);

            }
        });


    }

    private void initiateCalendarImport() {
        String userEmail = userData.getString("userEmail");
        if (userEmail != null) {
            calendarImportWithTokenInDB(userEmail);
        } else {
            Log.e(TAG, "User email is null");
        }
    }

    // Method to get token data and make request
    private void calendarImportWithTokenInDB(String userEmail) {
        httpsRequest.get(server_url + "/auth/google/token?useremail=" + userEmail, null, new HttpsCallback() {
            @Override
            public void onResponse(String response) {
                Log.d(TAG, "Calendar import initiated: " + response);
            }

            @Override
            public void onFailure(String error) {
                Log.e(TAG, "Error sending ID token: " + error);
            }
        });
    }

    // Method to send the ID token to the server
//    private void sendIdTokenToServer(String id_token, String refresh_token) {
//        try {
//            JSONObject headers = new JSONObject();
//            headers.put("id_token", id_token);
//            headers.put("refresh_token", refresh_token);
//            // Add other headers as needed
//
//            // Now you can pass this JSONObject to your post method
//            JSONObject postData = new JSONObject();
//            // populate postData as required
//
//            httpsRequest.post(server_url + "/auth/google/token", postData, headers, new HttpsCallback() {
//                @Override
//                public void onResponse(String response) {
//                    Log.d(TAG, "Calendar import initiated: " + response);
//                }
//
//                @Override
//                public void onFailure(String error) {
//                    Log.e(TAG, "Error sending ID token: " + error);
//                }
//            });
//        } catch (JSONException e) {
//            e.printStackTrace();
//        }

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

