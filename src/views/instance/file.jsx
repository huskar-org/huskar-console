import React from 'react';
import PropTypes from 'prop-types';
import FileSaver from 'file-saver';
import Raven from 'raven-js';
import { importProcess, exportProcess } from '../../services/utils/import-export';
import toast from '../../services/toast';
import api from '../../services/api';
import dialog from '../../services/dialog';
import prompt from '../../services/utils/prompt';
import Upload from '../../components/upload';
import DialogConfirm from '../../components/dialog/confirm';
import Button from '../../components/button';
import './file.sass';

export default class InstanceFile extends React.Component {
  static propTypes = {
    type: PropTypes.oneOf(['import', 'export']).isRequired,
    instanceType: PropTypes.string.isRequired,
    applicationName: PropTypes.string.isRequired,
    isEditable: PropTypes.bool,
    contentType: PropTypes.string,
    onCompleted: PropTypes.func.isRequired,
  };

  static defaultProps = {
    isEditable: true,
    contentType: 'application/octet-stream',
  };

  state = {
    overwrite: false,
  };

  handleImport = () => {
    this.upload.click();
  };

  handleUpload = (fileData) => {
    const { instanceType, applicationName, contentType } = this.props;
    const { overwrite } = this.state;
    const formData = new FormData();
    let payload;

    try {
      payload = importProcess(fileData, applicationName, instanceType);
    } catch (e) {
      toast(<span>{e.toString()}</span>);
      Raven.captureException(e);
      return;
    }

    formData.append('overwrite', overwrite ? '1' : '0');
    formData.append('application', applicationName);
    formData.append('import_file', new Blob([payload], { contentType }));
    api[`batch_${instanceType}`].post(formData).then((response) => {
      const { status, message, data } = response.data;
      if (status === 'SUCCESS') {
        dialog.then(c => c.popup(<DialogConfirm
          canChoose={false}
          content={`${data.import_num} items have been imported actually.`}
          onYes={() => {
            this.props.onCompleted();
            c.close();
          }}
        />));
      } else {
        prompt(`${status}: ${message || 'unknown error'}`);
      }
    });
  };

  handleClickExport = () => {
    const { applicationName, instanceType, contentType } = this.props;
    const fileName = `${applicationName}-${instanceType}.json`;
    const processor = data => exportProcess(data, applicationName, instanceType);

    api[`batch_${instanceType}`].get({
      application: applicationName,
      format: 'file',
    }).then((resp) => {
      if (resp.status < 400) {
        const text = processor(resp.xhr.responseText);
        const blob = new Blob([text], { type: contentType });
        FileSaver.saveAs(blob, fileName, true);
      } else {
        toast(<span>download failed</span>);
      }
    });
  };

  handleOverwriteChange = () => {
    const { overwrite } = this.state;
    this.setState({ overwrite: !overwrite });
  };

  handleReset = () => {
    this.setState({ overwrite: false });
  };

  contentFunc = (file) => {
    const { instanceType } = this.props;
    const { name } = file;
    return `确定要从文件 ${name} 中导入 ${instanceType} 数据？`;
  };

  renderForm = () => (
    <div className="instance-file--upload__form">
      <label htmlFor="instance-file-upload-form-overwrite">
        <input
          id="instance-file-upload-form-overwrite"
          type="checkbox"
          onChange={this.handleOverwriteChange}
        />
        <span>覆盖已存在的 key</span>
      </label>
      <div className="instance-file--upload__form-tip">
        温馨提示：导入前别忘了先通过导出功能备份一下数据。
      </div>
    </div>);

  render() {
    const { isEditable, type } = this.props;
    return type === 'import' ? (
      <Button
        onClick={this.handleImport}
        disabled={!isEditable}
      >
        <span>Import</span>
        <Upload
          contentFunc={this.contentFunc}
          onUpload={this.handleUpload}
          onClick={this.handleReset}
          additionalNode={this.renderForm()}
          buttonTexts={{ yes: '导入', no: '取消' }}
          ref={(ref) => { this.upload = ref; }}
        />
      </Button>
    ) : (
      <Button onClick={this.handleClickExport} disabled={!isEditable}>Export</Button>
    );
  }
}
