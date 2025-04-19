#include<stdio.h>
int min(int a[], int n ){
    int mini=a[0];
    for(int i=0; i<n; i++){
        if(mini > a[i]){
            mini = a[i];
        }
    }
    return mini;
}
int function(int a[],int n,int sum){
    int mini = min(a,n);
    int mini2=a[0];
    for(int i=0;i<n;i++){
        if(mini2 > mini && mini2 > a[i]){
            mini2 = a[i];
        }
    }
    printf("%d %d ", mini, mini2);
    if(mini>sum || mini2>sum)
        return -1;
    if(mini + mini2 > sum)
        return 0;
    else
        return mini * mini2;

}
int main(){
    int n;
    scanf("%d",&n);
    int a[n];
    for(int i=0;i<n;i++){
        scanf("%d",&a[i]);
    }
    int sum;
    scanf("%d",&sum);
    int res = function(a,n,sum);
    printf("%d\n",sum);
    return 0;
}
