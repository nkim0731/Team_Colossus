package com.example.frontend;


import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

import org.json.JSONException;
import org.json.JSONObject;


/*
 * Number of methods: 8
 * */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";
    private final String CHANNEL_ID = "32";
    private HttpsRequest httpsRequest;
    private final String server_url = ServerConfig.SERVER_URL;
    private GoogleSignInClient mGoogleSignInClient;
    private int RC_SIGN_IN = 1;
//    private Button signOutButton;
    private Bundle userData;

    //For detecting User Activity
    public static final String DETECTED_ACTIVITY = ".DETECTED_ACTIVITY";
    //Define an ActivityRecognitionClient//
//    private ActivityRecognitionClient mActivityRecognitionClient;


    /*
     * ChatGPT usage: Partial
     * */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        userData = new Bundle();
        httpsRequest = new HttpsRequest();

        // request location permissions
        checkPermissions();

        // handle sign in
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestProfile()
                .build();
        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);
        findViewById(R.id.button_googleSignIn).setOnClickListener(view -> {
            signIn();
        });

        createNotificationChannel();

        Intent intent = getIntent();
        if (intent != null && intent.getBooleanExtra("signout", false)) {
            signOut();
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(this);
        updateUI(account);
    }

    /*
     * ChatGPT usage: Partial
     * */
    private void updateUI(GoogleSignInAccount account) {
        if (account == null){
            Log.d(TAG, "There is no user signed in");
        }
        else {
            Intent loginSuccessIntent = new Intent(MainActivity.this, AfterSuccessLoginActivity.class);
            // extra data for use else where
            userData.putString("userId", account.getId());
            userData.putString("userEmail", account.getEmail());
            loginSuccessIntent.putExtras(userData);

            // send necessary data to backend for database
            JSONObject userJSON = new JSONObject();
            try {
                userJSON.put("username", account.getEmail());
                userJSON.put("id_token", account.getIdToken());
                userJSON.put("refresh_token", account.getServerAuthCode());
            } catch (JSONException e){
                Log.e(TAG, "unexpected JSON exception", e);
            }

            httpsRequest.post(server_url + "/login/google", userJSON, new HttpsCallback() {
                @Override
                public void onResponse(String response) {
                    try {
                        JSONObject responseObj = new JSONObject(response);
                        String responseResult = responseObj.getString("result");

                        if (responseResult.equals("login") || responseResult.equals("register")) {
                            startActivity(loginSuccessIntent); // show next page after user is validated with backend
                        } else {
                            Log.e(TAG, "Error");
                        }
                    } catch (JSONException e) {
                        Log.e(TAG, "JSON Exception while parsing /login/google response");
                    }
                }
                @Override
                public void onFailure(String error) {
                    Log.e(TAG, "Server error: " + error);
                }
            });
        }
    }
    /*
     * ChatGPT usage: No
     * */
    private void signOut() {
        mGoogleSignInClient.signOut()
                .addOnCompleteListener(this, new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        // ...
                        Log.d(TAG, "Log out successful");
                    }
                });
    }

    /*
     * ChatGPT usage: No
     * */
    private void signIn() {
        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
        startActivityForResult(signInIntent, RC_SIGN_IN);
    }

    /*
     * ChatGPT usage: No
     * */
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            handleSignInResult(task);
        }
    }



    /*
     * ChatGPT usage: No
     * */
    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);

            // Signed in successfully, show authenticated UI. Go to new page display info
            updateUI(account);
        } catch (ApiException e) {
            // The ApiException status code indicates the detailed failure reason.
            // Please refer to the GoogleSignInStatusCodes class reference for more information.
            Log.e(TAG, "signInResult:failed code=" + e.getStatusCode());
            updateUI(null);
        }
    }

    /*
     * ChatGPT usage: No
     * */
    // check location permissions
    private void checkPermissions() {
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            return;
        }
        if (ActivityCompat.shouldShowRequestPermissionRationale(this, android.Manifest.permission.ACCESS_COARSE_LOCATION)
                || ActivityCompat.shouldShowRequestPermissionRationale(this, android.Manifest.permission.ACCESS_FINE_LOCATION)) {
            new AlertDialog.Builder(this)
                    .setTitle("Need location permissions")
                    .setMessage("Need permissions to determine location and create schedules")
                    .setNegativeButton("Cancel", (dialogInterface, i) -> {
                        Toast.makeText(MainActivity.this, "Need location permissions", Toast.LENGTH_LONG).show();
                        dialogInterface.dismiss();
                    })
                    .setPositiveButton("Confirm", (dialogInterface, i) -> {
                        ActivityCompat.requestPermissions(MainActivity.this, new String[]{android.Manifest.permission.ACCESS_COARSE_LOCATION, android.Manifest.permission.ACCESS_FINE_LOCATION}, 1);
                    })
                    .create().show();
            return;
        }
        ActivityCompat.requestPermissions(this, new String[]{android.Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, 1);
    }

    /*
     * ChatGPT usage: Yes
     * */
    private void createNotificationChannel() {
        CharSequence name = "sample channel";
        String description = "sample notification channel";
        int importance = NotificationManager.IMPORTANCE_HIGH;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
        channel.setDescription(description);

        NotificationManager notificationManager = getSystemService(NotificationManager.class);
        notificationManager.createNotificationChannel(channel);

    }
}