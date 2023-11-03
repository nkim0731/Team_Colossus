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

public class MainActivity extends AppCompatActivity {

    private final String TAG = "MainActivity";
    private final String CHANNEL_ID = "32";
    private HttpsRequest httpsRequest;
    private final String server_url = "http://10.0.2.2:3000"; // TODO update with actual url
    private final String serverHttps_url = "https://calendo.westus2.cloudapp.azure.com:8081";
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

        // handle sign in
        // This asks for scopes to get refresh_token for user calendar access
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

        // navigate to main page if previously signed in before, but allow return
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(this);
        updateUI(account);

    }

    private void updateUI(GoogleSignInAccount account) {
        if (account == null){
            Log.e(TAG, "There is no user signed in");
        }
        else {
            Log.v(TAG, account.getId());
            Log.v(TAG, account.getDisplayName());
            Log.v(TAG, account.getEmail());
            Log.v(TAG, "access_token : " + account.getIdToken());
            Log.v(TAG, "refresh_token : " + account.getServerAuthCode());
            Intent loginSuccessIntent = new Intent(MainActivity.this, AfterSuccessLoginActivity.class);
            // extra data for use else where
            userData.putString("userId", account.getId());
            userData.putString("userEmail", account.getEmail());
            userData.putString("userGivenName", account.getGivenName());
//            userData.putString("userFamilyName", account.getFamilyName()); //these data is not used anywhere
//            userData.putString("userDisplayName", account.getDisplayName());
            userData.putString("userToken", account.getIdToken());
            if(!(account.getServerAuthCode() == null)) {
                userData.putString("userRefreshToken", account.getServerAuthCode());
            }
            loginSuccessIntent.putExtras(userData);

            // send necessary data to backend for database
            JSONObject userJSON = new JSONObject();
            try {
                userJSON.put("username", account.getEmail());
//                postData.put("userId", account.getId());
                userJSON.put("id_token", account.getIdToken());
                userJSON.put("refresh_token", account.getServerAuthCode());
            } catch (JSONException e){
                Log.e(TAG, "unexpected JSON exception", e);
            }

            httpsRequest.post(serverHttps_url + "/login/google", userJSON, new HttpsCallback() {
                @Override
                public void onResponse(String response) {
                    try {
                        JSONObject responseObj = new JSONObject(response);
                        String responseResult = responseObj.getString("result");

                        if (responseResult.equals("login")) {
                            Log.v(TAG,"The user successfully logged in");
                        } else if (responseResult.equals("register")) {
                            Log.v(TAG,"The user successfully registered");
                        } else {
                            // TODO create pop up message informing user of error
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


            // send necessary data to backend for database
            JSONObject tokenHeader = new JSONObject();
            try {
                tokenHeader.put("id_token", account.getIdToken());
                tokenHeader.put("refresh_token", account.getServerAuthCode());
            } catch (JSONException e){
                Log.e(TAG, "unexpected JSON exception", e);
            }

            httpsRequest.get(serverHttps_url + "/auth/google/token?useremail=" + account.getEmail(), tokenHeader, new HttpsCallback() {
                @Override
                public void onResponse(String response) {
                    try {
                        JSONObject responseObj = new JSONObject(response);
                        String eventsForAWeek = responseObj.getString("events");
                        Log.i(TAG,"eventsForAWeek : " + eventsForAWeek);
                        startActivity(loginSuccessIntent); // show next page after user validated with backend
                    } catch (JSONException e) {
                        Log.e(TAG, "JSON Exception while parsing response from google token calendar import");
                    }
                }
                @Override
                public void onFailure(String error) {
                    Log.e(TAG, "google token calendar import : " + error);
                }
            });

            // uncomment if testing without server
            //startActivity(loginSuccessIntent);
        }
    }

//    public void signIn() {
//        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
//        someActivityResultLauncher.launch(signInIntent);
//    }
//
//    // You can do the assignment inside onAttach or onCreate, i.e, before the activity is displayed
//    ActivityResultLauncher<Intent> someActivityResultLauncher = registerForActivityResult(
//            new ActivityResultContracts.StartActivityForResult(),
//            new ActivityResultCallback<ActivityResult>() {
//                @Override
//                public void onActivityResult(ActivityResult result) {
//                    if (result.getResultCode() == Activity.RESULT_OK) {
//                        // There are no request codes
//                        Intent data = result.getData();
//                        Log.d(TAG, data.toString());
//                        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
//                        handleSignInResult(task);
//                    }
//                }
//            });

    private void signIn() {
        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
        startActivityForResult(signInIntent, RC_SIGN_IN);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == RC_SIGN_IN) {
            Log.d(TAG, data.toString());
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

            // Signed in successfully, show authenticated UI. Go to new page display info
            updateUI(account);
        } catch (ApiException e) {
            // The ApiException status code indicates the detailed failure reason.
            // Please refer to the GoogleSignInStatusCodes class reference for more information.
            Log.w(TAG, "signInResult:failed code=" + e.getStatusCode());
            updateUI(null);
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
                    .setMessage("Need permissions to determine location")
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