export const SUMMIT_HOUR_NOTICE = '';
export const MINIMAL_MODE_NOTICE = times => (
  `面板上已经有超过 ${times} 个请求被降级受理, 一些面板功能可能不可用。`);
export const CREATE_APPLICATION_GUIDE = '';
export const CROSS_ZONE_WARNING = (source, target) => (
  '当前 Cluster 存在跨 E-Zone 的 Link '
  + `(${source.name || '未知'} → ${target.map(t => t.name || '未知').join('/')}), `
  + '这种配置仅可用于非多活服务'
);
export const MISSING_DEFAULT_CLUSTER_WARNING = defaultCluster => (
  `当前环境提供的服务缺失必需的默认集群 ${defaultCluster}，请设置默认集群。`
);
export const DEPRECATED_APPLICATION = name => (
  `${name} 即将下线, 原因可能包括: 不是合法的 app_id / 负责人通过外部系统下线。`
  + `正式下线后仍依赖 ${name} 的服务将无法启动`
);
export const DESENSITIZED_TIP = '数据内容已脱敏, 如需查看请申请管理权限';

export const INFRA_DOWNSTREAM_MIGRATION = '暂未支持对下游用户服务迁移基础设施'
  + ' app_id，如果您有这个需求，请邮件 huskar@example.com 告诉我们，'
  + '我们会加快支持进度。';
