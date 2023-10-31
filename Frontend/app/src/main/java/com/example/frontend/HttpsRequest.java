package com.example.frontend;

import android.util.Log;

import androidx.annotation.NonNull;

import org.json.JSONObject;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class HttpsRequest {

    private OkHttpClient client;
    private final String TAG = "getRequest";
    public HttpsRequest(){
        this.client = new OkHttpClient();
    }


    /*
     * Send GET request to server
     * Parameters: url: the url of server
     *
     * */
    public void get(String url, HttpsCallback callback){
        Request request = new Request.Builder()
                .url(url)
                .get()
                .build();


        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.d(TAG,"request err");
                callback.onFailure(e.getMessage());
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                if(response.isSuccessful()){
                    String responseData = response.body().string();
                    if(responseData != null){
                        callback.onResponse(responseData);
                    }else{
                        callback.onFailure("response is null");
                    }
                }else{
                    Log.d(TAG,"response fail");
                    callback.onFailure("response fail");
                }
            }
        });


    }


    /*
    * Send POST request to server
    * Parameters: url: the url of server
    *             postData: JSON object that would be send to server
    * */
    public void post(String url, JSONObject postData, HttpsCallback callback){
        MediaType mediaType = MediaType.parse("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(postData.toString(),mediaType);
        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .build();


        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.d(TAG,"request err");
                callback.onFailure(e.getMessage());
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                if(response.isSuccessful()){
                    String responseData = response.body().string();
                    if(responseData != null){
                        callback.onResponse(responseData);
                    }else{
                        callback.onFailure("response is null");
                    }
                }else{
                    Log.d(TAG,"response fail");
                    callback.onFailure("response fail");
                }
            }
        });


    }


    /*
     * Send PUT request to server
     * Parameters: url: the url of server
     *             postData: JSON object that would be send to server
     * */
    public void put(String url, JSONObject postData, HttpsCallback callback){
        MediaType mediaType = MediaType.parse("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(postData.toString(),mediaType);
        Request request = new Request.Builder()
                .url(url)
                .put(body)
                .build();


        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.d(TAG,"request err");
                callback.onFailure(e.getMessage());
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                if(response.isSuccessful()){
                    String responseData = response.body().string();
                    if(responseData != null){
                        callback.onResponse(responseData);
                    }else{
                        callback.onFailure("response is null");
                    }
                }else{
                    Log.d(TAG,"response fail");
                    callback.onFailure("response fail");
                }
            }
        });


    }
}
