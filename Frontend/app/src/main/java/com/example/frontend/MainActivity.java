package com.example.frontend;

import androidx.activity.result.ActivityResultCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.Toast;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.Scope;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

import com.google.android.gms.location.ActivityRecognitionClient;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.net.SocketTimeoutException;

public class MainActivity extends AppCompatActivity {

    private final String TAG = "MainActivity";
    private final String CHANNEL_ID = "32";
    private HttpsRequest httpsRequest;

    private final String server_url = ServerConfig.SERVER_URL;
    private GoogleSignInClient mGoogleSignInClient;
    private int RC_SIGN_IN = 1;
    private Button signOutButton;
    private Bundle userData;

    //For detecting User Activity
    public static final String DETECTED_ACTIVITY = ".DETECTED_ACTIVITY";
    //Define an ActivityRecognitionClient//
    private ActivityRecognitionClient mActivityRecognitionClient;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        userData = new Bundle();
        httpsRequest = new HttpsRequest();

        // request location permissions
        checkPermissions();

        // handle sign in
//        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
//                .requestEmail()
//                .requestProfile()
//                .build();


        // This asks for scopes to get refresh_token for user calendar access
        // this does not have the necessary permissions to run
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestProfile()
                .requestEmail()
                .requestIdToken(getString(R.string.server_client_id))
                .requestServerAuthCode(getString(R.string.server_client_id))
                .requestScopes(
                        new Scope("https://www.googleapis.com/auth/calendar.readonly"),
                        new Scope("https://www.googleapis.com/auth/userinfo.email"),
                        new Scope("https://www.googleapis.com/auth/userinfo.profile")
                )
                .build();

        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);
        findViewById(R.id.button_googleSignIn).setOnClickListener(view -> {
            signIn();
        });



        // handle sign out
        signOutButton = findViewById(R.id.button_signOut);
        signOutButton.setOnClickListener(view -> signOut());

        createNotificationChannel();

        //Do silentSignIn to refresh the IdToken of the user without asking user to sign in again
        //If there is no user, it will show toast "please sign in "
        //if successful, it will automatically call updateUI(refreshedAccount)
        performSilentSignIn();

        // navigate to main page if previously signed in before, but allow return
//        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(this);
//        updateUI(account);
    }

    private void updateUI(GoogleSignInAccount account) {
        if (account == null){
            Log.d(TAG, "There is no user signed in");
        }
        else {
            Log.v(TAG, account.getId());
            Log.v(TAG, account.getDisplayName());
            Log.v(TAG, account.getEmail());
            Log.v(TAG, "id_token : " + account.getIdToken());
            Log.v(TAG, "refresh_token : " + account.getServerAuthCode());
            Intent loginSuccessIntent = new Intent(MainActivity.this, AfterSuccessLoginActivity.class);
            // extra data for use else where
            userData.putString("userId", account.getId());
            userData.putString("userEmail", account.getEmail());
            userData.putString("userIdToken", account.getIdToken());
//            userData.putString("userRefreshToken", account.getServerAuthCode());
            if(account.getServerAuthCode() != null) {
                userData.putString("userRefreshToken", account.getServerAuthCode());
            }
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

                        if (responseResult.equals("login") || responseResult.equals("register")) { // stop touching this
                            // if you want to add things to the signin sequence do it here and before startActivity
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
                    Log.e(TAG, "google login or register : " + error);
                }
            });
        }
    }

    private void signIn() {
        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
        startActivityForResult(signInIntent, RC_SIGN_IN);
    }

    private void performSilentSignIn() {
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(this);
        if (account != null) {
            mGoogleSignInClient.silentSignIn().addOnCompleteListener(this, new OnCompleteListener<GoogleSignInAccount>() {
                @Override
                public void onComplete(@NonNull Task<GoogleSignInAccount> task) {
                    handleSignInResult(task);
                }
            });
        } else {
            // No user is signed in. Handle this case as needed.
            Toast.makeText(this, "Please sign in", Toast.LENGTH_SHORT).show();
        }
    }





    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            handleSignInResult(task);
        }
    }

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

    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);

            // Silent sign-in was successful, and you now have an account with a refreshed ID token.
            String refreshedIdToken = account.getIdToken();

            if (refreshedIdToken != null) {
                // The ID token was successfully refreshed, and refreshedIdToken contains the new ID token.
                // You can update your UI or perform any necessary actions with the refreshed ID token.
                Log.d(TAG, "Refreshed ID token: " + refreshedIdToken);

                // Handle the refreshed account or token as needed here.
                // For example, you can pass it to other methods or update the UI.
                updateUI(account);
            } else {
                // The ID token is null, indicating that it was not successfully refreshed.
                // You may want to re-sign in manually or take appropriate actions.
                Log.e(TAG, "ID token was not refreshed");
                // Display a toast or handle the case where the ID token was not refreshed.
            }
        } catch (ApiException e) {
            // Handle exceptions that occurred during silent sign-in.
            Log.e(TAG, "Silent sign-in failed with code: " + e.getStatusCode());
            // You can decide how to handle the error, e.g., re-sign in manually.

            // No user is signed in. Handle this case as needed.
            Toast.makeText(this, "Please sign in", Toast.LENGTH_SHORT).show();
        }
    }


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