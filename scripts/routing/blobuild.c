#include <stdio.h>
#include <string.h>
typedef unsigned int uint32;
typedef unsigned short uint16;

#define MAXSTR             2048
#define MAXNODES           10000
#define STRFMT             "%2048s"

uint32 nodecnt, lststart, lstlen, nodeidx, datalen;
int nodex, nindex[MAXNODES];

main(int argc, char** argv)
{
  if (argc < 4) {
    fprintf(stderr, "Usage: %s <infile> <outindex> <outdata>\n\nKad vidish beli dim\nZnaj da nije magla\nTo su zadimili buksne\nAjzaklija i Bvana\n", argv[0]);
    return(-1);
  }
  FILE  *in = fopen(argv[1], "r"),
        *outi = fopen(argv[2], "w"),
        *outd = fopen(argv[3], "w");

  char cmd[ MAXSTR + 1 ];
  uint32 idx, i = 0;
  uint16 adj, adjr, weight, walk;
  int a;
  char dummy[5];
  while (!feof(in)) {
    fscanf(in, STRFMT, cmd);
    if (feof(in)) break;
    
    if (!strcmp(cmd, "nodes")) {
      fscanf(in, "%u", &nodecnt);
      fwrite(&nodecnt, 1, sizeof(uint32), outi);
      a = nodecnt;
      while (a--) {
        fscanf(in, "%u", &idx);
        nindex[idx] = i++;
      }
    } else if (!strcmp(cmd, "node")) {
      if (nodex) {
        fwrite(&lststart, 1, sizeof(uint32), outi);
        fwrite(&lstlen, 1, sizeof(uint32), outi);
      }
      
      fscanf(in, "%u", &idx);
      fwrite(&idx, 1, sizeof(uint32), outi);
      lststart = datalen;
      lstlen = 0;
      nodex = 1;
    } else if (!strcmp(cmd, "adj") || !strcmp(cmd, "adjw")) {
      fscanf(in, "%hu %2s %hu", &adj, dummy, &weight);
      adjr = nindex[adj];
      fwrite(&adjr, 1, sizeof(uint16), outd);
      fwrite(&weight, 1, sizeof(uint16), outd);
      walk = (strcmp(cmd, "adjw") == 0);
      fwrite(&walk, 1, sizeof(uint16), outd);
      datalen += 3;
      ++lstlen;
    }
  }
  
  fwrite(&lststart, 1, sizeof(uint32), outi);
  fwrite(&lstlen, 1, sizeof(uint32), outi);
  
  fclose(in);
  fclose(outi);
  fclose(outd);
  return(0);
}
