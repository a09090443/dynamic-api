import {Component, Inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatIcon} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {NgClass, NgIf} from "@angular/common";
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatCheckbox} from "@angular/material/checkbox";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {Wsdl} from "../model/models";
import {RestfulService} from "../service/restful.service";
import {MatRadioButton, MatRadioGroup} from "@angular/material/radio";

@Component({
  selector: 'app-wsdl-gen-obj',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIcon,
    MatInputModule,
    NgIf,
    MatIconButton,
    MatCheckbox,
    MatDialogActions,
    MatButton,
    MatDialogTitle,
    MatDialogContent,
    MatFormFieldModule,
    NgClass,
    MatRadioGroup,
    MatRadioButton
  ],
  templateUrl: './wsdl-gen-obj.component.html',
  styleUrl: './wsdl-gen-obj.component.css'
})
export class WsdlGenObjComponent {
  form!: FormGroup;
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;
  countdown: number | null = null;
  selectedFile: File | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Wsdl,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<WsdlGenObjComponent>,
    private restfulService: RestfulService
  ) {
    this.initializeForm(data || {} as Wsdl); // 初始化表单
  }

  private initializeForm(data: Wsdl): void {
    this.form = this.fb.group({
      inputType: ['url', Validators.required],
      wsdlPath: [data.wsdlPath || '', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  clearField(fieldName: string): void {
    this.form.get(fieldName)!.setValue('');
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  isFormValid(): boolean {
    return (this.form.get('inputType')?.value === 'url' && this.form.valid) || this.selectedFile !== null;
  }

  async execute(): Promise<void> {

    const inputType = this.form.get('inputType')?.value;
    let wsdlData: string | File;

    if (inputType === 'url') {
      if (this.form.invalid) return;
      wsdlData = this.form.get('wsdlPath')?.value;
    } else if (this.selectedFile) {
      wsdlData = this.selectedFile;
    } else {
      this.showMessage('請選擇文件或輸入 URL', 'error');
      return;
    }

    try {
      const response = await this.restfulService.generateWsdlObject(wsdlData);
      this.showMessage('WSDL 對象生成成功', 'success');
      this.startCountdown();
      this.downloadFile(response);
    } catch (error) {
      this.showMessage('生成失敗：' + error, 'error');
    }
  }

  private downloadFile(data: Blob): void {
    const blob = new Blob([data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'generated_wsdl_object.zip';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
  }

  private startCountdown(): void {
    this.countdown = 5;
    const timer = setInterval(() => {
      this.countdown!--;
      if (this.countdown === 0) {
        clearInterval(timer);
        this.dialogRef.close();
      }
    }, 1000);
  }

  onInputTypeChange() {
    const inputType = this.form.get('inputType')?.value;
    if (inputType === 'url') {
      this.form.get('wsdlPath')?.reset('');
      this.selectedFile = null; // Reset file if file is selected previously
    } else if (inputType === 'file') {
      this.form.get('wsdlPath')?.reset('');
    }
  }
}
