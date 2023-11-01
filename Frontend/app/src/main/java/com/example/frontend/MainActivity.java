package com.example.frontend;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;

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

    String userEmail;
    String userGivenName;
    String userFamilyName;
    String userAccountIDToken;
    String displayName;
    String serverAuthCode;
    String userId;

    private Button signOutButton;
    private Button activityButton;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .build();
        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);

        findViewById(R.id.button_googleSignIn).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                signIn();
            }
        });
        signOutButton = findViewById(R.id.button_signOut);
        signOutButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                signOut();
            }
        });

        activityButton = findViewById(R.id.button_activity);
        activityButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent afterSuccessLoginIntent = new Intent(MainActivity.this, AfterSuccessLoginActivity.class);
                startActivity(afterSuccessLoginIntent);
            }
        });

        createNotificationChannel();
//        // initialize socket connection
//        Socket socket = SocketManager.getSocket();
//        socket.connect();
//        chatButton = findViewById(R.id.button_chat);
//        chatButton.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                Intent chatIntent = new Intent(MainActivity.this,GroupChat.class);
//                startActivity(chatIntent);
//            }
//        });
    }
    @Override
    protected void onStart() {
        super.onStart();
        // Check for existing Google Sign In account, if the user is already signed in
        // the GoogleSignInAccount will be non-null.
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(this);
        updateUI(account);
        Log.d(TAG, "end1");
    }
    private void updateUI(GoogleSignInAccount account) {
        if (account == null){
            Log.d(TAG, "There is no user signed in");
        }
        else {

            Log.d(TAG, "else");

            serverAuthCode = account.getServerAuthCode();
            userId = account.getId();
            userAccountIDToken = account.getIdToken();
            userEmail = account.getEmail();
            userGivenName = account.getGivenName();
            userFamilyName = account.getFamilyName();
            displayName = account.getDisplayName();

            Log.d(TAG, account.getDisplayName());

            startLoginServerActivity();

        }
    }
    private void startLoginServerActivity() {
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
    }


    private void signIn() {
        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
        signInLauncher.launch(signInIntent);
    }
    private ActivityResultLauncher<Intent> signInLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK) {
                    Intent data = result.getData();
                    Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
                    handleSignInResult(task);
                }
            }
    );
    private void signOut() {
        mGoogleSignInClient.signOut()
                .addOnCompleteListener(this, new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        // ...
                        Log.d("TAG", "Log out successful");
                    }
                });
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Result returned from launching the Intent from GoogleSignInClient.getSignInIntent(...);
        if (requestCode == RC_SIGN_IN) {
            // The Task returned from this call is always completed, no need to attach
            // a listener.
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            handleSignInResult(task);
        }
    }

    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            updateUI(account);
        } catch (ApiException e) {
            // The ApiException status code indicates the detailed failure reason.
            // Please refer to the GoogleSignInStatusCodes class reference for more information.
            Log.w(TAG, "signInResult:failed code=" + e.getStatusCode());
            updateUI(null);
        }
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