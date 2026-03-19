import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterIssues'
})
export class FilterIssuesPipe implements PipeTransform {
  transform(issues: any[], searchTerm: string): any[] {
    if (!issues || !searchTerm) {
      return issues;
    }
    const lowerTerm = searchTerm.toLowerCase();
    return issues.filter(issue =>
      (issue.key && issue.key.toLowerCase().includes(lowerTerm)) ||
      (issue.resumo && issue.resumo.toString().toLowerCase().includes(lowerTerm)) ||
      (issue.status && issue.status.toLowerCase().includes(lowerTerm)) ||
      (issue.situacao && issue.situacao.toLowerCase().includes(lowerTerm)) ||
      (issue.veiculo && issue.veiculo.toLowerCase().includes(lowerTerm))
    );
  }
}
