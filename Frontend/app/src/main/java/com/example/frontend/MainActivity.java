package com.example.frontend;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
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
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

import java.net.URISyntaxException;

import io.socket.client.IO;
import io.socket.client.Socket;

public class MainActivity extends AppCompatActivity {

    private final String TAG = "MainActivity";
    private final String CHANNEL_ID = "32";
    private GoogleSignInClient mGoogleSignInClient;
    private int RC_SIGN_IN = 1;
    private Button signOutButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // handle sign in
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .build();
        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);
        findViewById(R.id.button_googleSignIn).setOnClickListener(view -> {
            signIn();
        });

        // handle sign out
        signOutButton = findViewById(R.id.button_signOut);
        signOutButton.setOnClickListener(view -> signOut());

        // when opening app check if logged in and go to main menu
        // but allow user to return to main menu for logout
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(this);
        updateUI(account);

        createNotificationChannel();
    }

//    @Override
//    protected void onStart() {
//        super.onStart();
//        // Check for existing Google Sign In account, if the user is already signed in
//        // the GoogleSignInAccount will be non-null.
//        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(this);
//        updateUI(account);
//    }

    private void updateUI(GoogleSignInAccount account) {
        if (account == null){
            Log.d(TAG, "There is no user signed in");
        }
        else {
            Log.d(TAG, account.getDisplayName());
            Intent loginSuccessIntent = new Intent(MainActivity.this, AfterSuccessLoginActivity.class);
            // extra data for use else where
            Bundle userData = new Bundle();
            userData.putString("username", account.getEmail());
            userData.putString("token", account.getIdToken());
            userData.putString("authCode", account.getServerAuthCode());

            loginSuccessIntent.putExtras(userData);
            startActivity(loginSuccessIntent);
        }
    }

//    private void startLoginServerActivity() {
//        Intent serverLoginInfoIntent = new Intent(MainActivity.this, LoginServerActivity.class);
//        serverLoginInfoIntent.putExtra("userEmail", userEmail);
//        serverLoginInfoIntent.putExtra("userGivenName", userGivenName);
//        serverLoginInfoIntent.putExtra("userFamilyName", userFamilyName);
//        serverLoginInfoIntent.putExtra("userDisplayName", displayName);
//        serverLoginInfoIntent.putExtra("userAccountIDToken", userAccountIDToken);
//        serverLoginInfoIntent.putExtra("serverAuthCode", serverAuthCode);
//        serverLoginInfoIntent.putExtra("userId", userId);
//
//        Log.d(TAG, userEmail);
//        Log.d(TAG, serverLoginInfoIntent.toString());
//
//        startActivity(serverLoginInfoIntent);
//    }

    private void signIn() {
        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
        startActivityForResult(signInIntent, RC_SIGN_IN);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            handleSignInResult(task);
        }
    }
//    private ActivityResultLauncher<Intent> signInLauncher = registerForActivityResult(
//            new ActivityResultContracts.StartActivityForResult(),
//            result -> {
//                if (result.getResultCode() == Activity.RESULT_OK) {
//                    Intent data = result.getData();
//                    Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
//                    handleSignInResult(task);
//                }
//            }
//    );
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