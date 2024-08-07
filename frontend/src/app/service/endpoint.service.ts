import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from "@angular/common/http";
import {catchError, firstValueFrom, Observable, throwError} from "rxjs";
import { config } from '../config';

@Injectable({
  providedIn: 'root'
})
export class EndpointService {

  constructor(private http: HttpClient) {
  }

  fetchData(): Promise<any> {
    return firstValueFrom(this.http.get(`${config.apiUrl}/dynamic-api/ws/getEndpoints`));
  }

  saveFormData(formData: any): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${config.apiUrl}/dynamic-api/ws/saveWebService`, formData));
  }

  updateFormData(formData: any): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${config.apiUrl}/dynamic-api/ws/updateWebService`, formData));
  }

  async deleteEndpoint(publishUrls: string[]): Promise<any> {
    return await firstValueFrom(this.http.request('delete', `${config.apiUrl}/dynamic-api/ws/removeWebService`, {
      body: publishUrls
    }).pipe(
      catchError(this.handleError)
    ));
  }

  async switchWebservice(publishUri: string, isActive: boolean): Promise<any> {
    const params = new HttpParams()
      .set('publishUri', publishUri)
      .set('isActive', isActive.toString());
    return await firstValueFrom(this.http.get(`${config.apiUrl}/dynamic-api/ws/switchWebService`, { params }));
  }

  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response: any = await firstValueFrom(this.http.post(`${config.apiUrl}/dynamic-api/common/uploadJarFile`, formData).pipe(
        catchError(this.handleError)
      ));
      if (response.code === 200) {
        return response.data; // 返回 data
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error; // 可以根據需要進行進一步處理
    }
  }

  private handleError(error: HttpErrorResponse): Observable<string> {
    if (error.error instanceof ErrorEvent) {
      // 客戶端或網絡錯誤
      console.error('An error occurred:', error.error.message);
    } else {
      // 伺服器返回錯誤狀態碼
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // 返回一個可以處理的錯誤訊息 Observable
    // @ts-ignore
    return throwError<string>('Something bad happened; please try again later.');
  }

  async generateWsdlObject(wsdlData: string | File): Promise<any> {
    let url = `${config.apiUrl}/dynamic-api/ws/genWsdlObj`;
    const formData = new FormData();

    if (typeof wsdlData === 'string') {
      // 如果是 URL，直接加入 FormData
      formData.append('wsdlUrl', wsdlData);
    } else {
      // 如果是文件，加入 FormData
      formData.append('file', wsdlData);
    }

    try {
      const response: any = await firstValueFrom(this.http.post(url, formData, {
        responseType: 'blob'
      }).pipe(
        catchError(this.handleError)
      ));

      // 假設成功響應是一個 Blob 對象
      return response;
    } catch (error) {
      console.error('Error generating WSDL object:', error);
      throw error;
    }
  }
}
